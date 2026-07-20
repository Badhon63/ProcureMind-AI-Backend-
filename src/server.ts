import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { Item } from "./models/item.js";
import { GoogleGenAI } from "@google/genai";

dotenv.config();
const app = express();

// 🌐 CORS Fix (সব অরিজিন এলাউ করা হয়েছে টেস্টের জন্য)
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);

app.use(express.json());

// 🔐 Better Auth Handler
app.all("/api/auth/*splat", toNodeHandler(auth));

// 🚀 Database Connection
const mongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/procuremind";

mongoose
  .connect(mongoUri)
  .then(() => console.log("🚀 MongoDB Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.get("/", (req: Request, res: Response) => {
  res.send("ProcureMind AI Backend is running!");
});

// 📋 ১. GET Items
app.get("/api/items", async (req: Request, res: Response) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("GET /api/items error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// 📩 ২. POST Item
app.post("/api/items", async (req: Request, res: Response) => {
  try {
    const newItem = new Item(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    console.error("Error creating item:", err);
    res.status(500).json({ error: "Failed to create procurement request" });
  }
});

// 🗑️ ৩. DELETE Item
app.delete("/api/items/:id", async (req: Request, res: Response) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// 🤖 ৪. AI Analysis
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

app.post("/api/ai/analyze", async (req: Request, res: Response) => {
  const { supplyData } = req.body;
  try {
    const prompt = `You are an expert supply chain procurement AI agent. Analyze the following budget data and output a clean, strict JSON response containing three keys: "rawMaterialsCost", "logisticsCost", "savingsOpportunity", and "riskAnalysisSummary". Do not include any markdown or backticks in the response. Data: ${supplyData}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const result = JSON.parse(response.text?.trim() || "{}");
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI Processing Failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🔥 Server running with Better-Auth on port ${PORT}`),
);
