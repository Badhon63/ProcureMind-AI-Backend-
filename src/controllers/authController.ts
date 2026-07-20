import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.js";

// 📝 Register Controller
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const cleanEmail = email?.trim().toLowerCase();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // 🔒 Password Hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email: cleanEmail,
      password: hashedPassword,
    });
    await newUser.save();

    res
      .status(201)
      .json({ success: true, message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
};

// 🔐 Login Controller
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email?.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 🔑 Verify Password Hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};
