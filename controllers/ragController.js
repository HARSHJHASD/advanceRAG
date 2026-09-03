import { askRAG } from "../services/ragService.js";

export async function askQuestion(req, res) {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const result = await askRAG(question);

    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      retrievalResults: result.retrievalResults,
    });
  } catch (error) {
    console.error("RAG Controller Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process question",
      error: error.message,
    });
  }
}