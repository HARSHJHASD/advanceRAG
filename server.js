import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { initializeRAGDocuments } from "./services/ingestionService.js";
import {
  rateLimit,
  requestObservability,
} from "./services/requestMiddleware.js";

import ragRoutes from "./routes/ragRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// =========================
// ESM DIRECTORY SETUP
// =========================

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

// =========================
// MIDDLEWARE
// =========================

app.use(express.json({ limit: "100kb" }));
app.use(requestObservability);

// =========================
// API ROUTES
// =========================

app.use("/api/rag", rateLimit, ragRoutes);

// =========================
// SERVE FRONTEND FILES
// =========================

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

// =========================
// HOME ROUTE
// =========================

app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );
});

// =========================
// START SERVER
// =========================

async function startServer() {
  // Complete ingestion before accepting requests so query traffic never
  // competes with startup embeddings for Gemini quota.
  await initializeRAGDocuments();

  app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
  });
}

startServer();
