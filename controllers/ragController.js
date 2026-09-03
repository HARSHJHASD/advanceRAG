import {
  askRAG,
} from "../services/ragService.js";

export async function askQuestion(req, res) {
  try {
    const { question } = req.body;

    // Validate question
    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    // Call RAG Service
    const result =
      await askRAG(question);

    res.json({
      success: true,
      question,
      answer: result.answer,
      sources: result.sources,
    });

  } catch (error) {
    console.error(
      "RAG Controller Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to process question",
      error: error.message,
    });
  }
}