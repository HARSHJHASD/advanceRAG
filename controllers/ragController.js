import { askRAG } from "../services/ragService.js";

export async function askQuestion(req, res) {
  try {
    const { question, topic, sessionId } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const result = await askRAG(
      question,
      topic,
      sessionId
    );

    res.json(result);
  } catch (error) {
    console.error("RAG Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process question",
      error: error.message,
    });
  }
}
