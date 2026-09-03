import { CloudClient } from "chromadb";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// ChromaDB Cloud Client
const chromaClient = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});

// Basic endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Advanced RAG server is running 🚀",
  });
});

// Express test endpoint
app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello from Express!",
  });
});

// ChromaDB connection test
app.get("/api/chroma-test", async (req, res) => {
  try {
    const heartbeat = await chromaClient.heartbeat();

    res.json({
      success: true,
      message: "Connected to ChromaDB Cloud successfully",
      heartbeat,
    });
  } catch (error) {
    console.error("ChromaDB Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to connect to ChromaDB Cloud",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});