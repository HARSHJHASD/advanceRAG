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

    console.log(JSON.stringify({
      event: "rag_request_completed",
      requestId: req.requestId,
      sourceCount: result.sources.length,
      rawRetrievalCount: result.retrievalResults.length,
    }));

    res.json(result);
  } catch (error) {
    console.error("RAG Error:", {
      requestId: req.requestId,
      message: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to process question",
      requestId: req.requestId,
    });
  }
}
