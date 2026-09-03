import express from "express";
import dotenv from "dotenv";

import ragRoutes from "./routes/ragRoutes.js";
import { initializeRAGDocuments } from "./services/ingestionService.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve Frontend
app.use(express.static("public"));

// API Routes
app.use("/api", ragRoutes);

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  try {
    await initializeRAGDocuments();
  } catch (error) {
    console.error(
      "Failed to initialize RAG documents:",
      error
    );
  }
});