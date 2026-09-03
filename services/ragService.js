import { rewriteQuery } from "./queryRewritingService.js";
import { generateMultipleQueries } from "./multiQueryService.js";
import { searchSimilarDocuments } from "./vectorStoreService.js";
import { generateEmbedding } from "./embeddingService.js";
import { generateAnswer } from "./geminiService.js";

const SIMILARITY_THRESHOLD = 1.1;

export async function processRAGQuestion(question, topic = "all") {
  const rewrittenQuery = await rewriteQuery(question);
  const searchQueries = await generateMultipleQueries(question, rewrittenQuery);

  console.log("\nMulti Query Retrieval:", searchQueries);

  // Preserve each independent vector-store hit for diagnostics and UI display.
  const rawRetrievalResults = [];

  for (const query of searchQueries) {
    console.log(`Searching for: ${query}`);

    const embedding = await generateEmbedding(query);
    const results = await searchSimilarDocuments({
      embedding,
      topic,
      limit: 5,
    });

    rawRetrievalResults.push(
      ...results.map((result) => ({
        ...result,
        retrievedBy: [query],
      }))
    );
  }

  // A Chroma ID identifies a stored document chunk. Keep its closest hit while
  // recording every query that retrieved that same chunk.
  const uniqueResultsMap = new Map();

  for (const result of rawRetrievalResults) {
    const existing = uniqueResultsMap.get(result.id);

    if (!existing) {
      uniqueResultsMap.set(result.id, {
        ...result,
        retrievedBy: [...result.retrievedBy],
      });
      continue;
    }

    const retrievedBy = [
      ...new Set([...existing.retrievedBy, ...result.retrievedBy]),
    ];

    if (result.distance < existing.distance) {
      uniqueResultsMap.set(result.id, { ...result, retrievedBy });
    } else {
      existing.retrievedBy = retrievedBy;
    }
  }

  const mergedResults = [...uniqueResultsMap.values()].sort(
    (a, b) => a.distance - b.distance
  );

  // Only threshold-qualified chunks are sources or LLM context. Raw results
  // remain available in retrievalResults for debugging.
  const sources = mergedResults.filter(
    (result) => result.distance <= SIMILARITY_THRESHOLD
  );

  if (sources.length === 0) {
    return {
      success: true,
      answer:
        "I couldn't find relevant information in the selected documents.",
      originalQuestion: question,
      rewrittenQuery,
      searchQueries,
      sources: [],
      retrievalResults: rawRetrievalResults,
    };
  }

  const context = sources
    .slice(0, 5)
    .map((result, index) => `Source ${index + 1}:\n${result.document}`)
    .join("\n\n");

  const answer = await generateAnswer(question, context);

  return {
    success: true,
    answer,
    originalQuestion: question,
    rewrittenQuery,
    searchQueries,
    sources,
    retrievalResults: rawRetrievalResults,
  };
}

export async function askRAG(question, topic = "all") {
  return processRAGQuestion(question, topic);
}
