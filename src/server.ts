import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { Item } from "./models/Item.js";
import { GoogleGenAI } from "@google/genai";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ডাটাবেজ কানেকশন
const mongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/procuremind";
mongoose
  .connect(mongoUri)
  .then(() => console.log("🚀 MongoDB Connected Successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// টেস্ট রুট
app.get("/", (req: Request, res: Response) => {
  res.send("ProcureMind AI Backend is running!");
});

// 📩 ১. নতুন আইটেম বা RFP যোগ করার রুট
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

// 📋 ২. সব আইটেম গেট করার রুট
app.get("/api/items", async (req: Request, res: Response) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// 🗑️ ৩. আইটেম ডিলিট করার রুট
app.delete("/api/items/:id", async (req: Request, res: Response) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// 🤖 ৪. এআই অ্যানালাইসিস রুট
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
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
