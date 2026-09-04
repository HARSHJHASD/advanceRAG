import { generateContent } from "./geminiService.js";

function fallbackToRetrievalRanking(documents) {
  return documents.map((document, index) => ({
    ...document,
    rerankScore: null,
    rerankFallback: true,
    originalRank: index + 1,
  }));
}

export async function rerankDocuments(question, documents) {
  if (!documents?.length) {
    return [];
  }

  // RRF already produces a strong deterministic ordering. Reserve Gemini
  // capacity for answer generation unless reranking is explicitly enabled.
  if (process.env.USE_LLM_RERANKING !== "true") {
    return fallbackToRetrievalRanking(documents);
  }

  try {
    const candidates = documents
      .map(
        (document, index) => `Candidate ${index}\n${document.document}`
      )
      .join("\n\n");

    const response = await generateContent(`
You are a reranker for retrieval-augmented generation. Score every candidate
according to how directly it answers the user's question. Use a score from 0
to 100, where 100 is highly relevant. Do not answer the question.

User question:
${question}

Candidates:
${candidates}

Return only a JSON array with exactly one object for every candidate, using
this shape: [{"index": 0, "score": 87}]. Include every candidate index once.
`);

    const parsed = JSON.parse(
      response.replace(/```(?:json)?/gi, "").trim()
    );

    if (!Array.isArray(parsed)) {
      throw new Error("Reranker did not return a JSON array");
    }

    const scoresByIndex = new Map();

    for (const item of parsed) {
      const index = Number(item?.index);
      const score = Number(item?.score);

      if (
        Number.isInteger(index) &&
        index >= 0 &&
        index < documents.length &&
        Number.isFinite(score) &&
        !scoresByIndex.has(index)
      ) {
        scoresByIndex.set(index, Math.max(0, Math.min(100, score)));
      }
    }

    // A partial/invalid ranking would silently drop context, so use the
    // established vector ordering instead unless every candidate was scored.
    if (scoresByIndex.size !== documents.length) {
      throw new Error("Reranker did not score every candidate exactly once");
    }

    return documents
      .map((document, index) => ({
        ...document,
        rerankScore: scoresByIndex.get(index),
      }))
      .sort((a, b) => b.rerankScore - a.rerankScore);
  } catch (error) {
    console.error(
      "Reranking failed. Falling back to vector search ranking:",
      error.message
    );

    return fallbackToRetrievalRanking(documents);
  }
}
