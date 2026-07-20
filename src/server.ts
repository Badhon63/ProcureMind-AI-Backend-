import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import { IItem } from "./models/Item.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

if (!mongoUri) {
  throw new Error("MONGO_URI environment variable is not set");
}

app.get("/", (req: Request, res: Response) => {
  res.send("ProcureMind AI Backend is running!");
});

const client = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("ProcureMind-AI");
    const itemsCollection = db.collection<IItem>("items");

    // ১. GET Items
    app.get("/api/items", async (req: Request, res: Response) => {
      try {
        const items = await itemsCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.json(items);
      } catch (err) {
        console.error("GET /api/items error:", err);
        res.status(500).json({ error: "Server Error" });
      }
    });

    app.get("/api/items/mine", async (req: Request, res: Response) => {
      try {
        const { userId } = req.query;
        if (!userId) {
          return res.status(400).json({ error: "userId is required" });
        }
        const items = await itemsCollection
          .find({ userId: userId as string })
          .sort({ createdAt: -1 })
          .toArray();
        res.json(items);
      } catch (err) {
        console.error("GET /api/items/mine error:", err);
        res.status(500).json({ error: "Server Error" });
      }
    });

    // ২. POST Item
    app.post("/api/items", async (req: Request, res: Response) => {
      try {
        const newItem: IItem = {
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await itemsCollection.insertOne(newItem);
        res.status(201).json({ _id: result.insertedId, ...newItem });
      } catch (err) {
        console.error("Error creating item:", err);
        res.status(500).json({ error: "Failed to create procurement request" });
      }
    });

    // ৩. DELETE Item
    app.delete(
      "/api/items/:id",
      async (req: Request<{ id: string }>, res: Response) => {
        try {
          const query = { _id: new ObjectId(req.params.id) };
          await itemsCollection.deleteOne(query);
          res.json({ success: true, message: "Item deleted successfully" });
        } catch (err) {
          console.error("DELETE /api/items/:id error:", err);
          res.status(500).json({ error: "Failed to delete item" });
        }
      },
    );

    // ৪. AI Analysis
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

    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

run();
