import { rewriteQuery } from "./queryRewritingService.js";
import { generateMultipleQueries } from "./multiQueryService.js";
import { searchSimilarDocuments } from "./vectorStoreService.js";
import { generateEmbedding } from "./embeddingService.js";
import { generateAnswer } from "./geminiService.js";
import { rerankDocuments } from "./rerankingService.js";
import { compressContext } from "./contextCompressionService.js";

const SIMILARITY_THRESHOLD = 1.1;
const RERANK_THRESHOLD = 60;
const FINAL_DOCUMENT_LIMIT = 3;

export async function processRAGQuestion(question, topic = "all") {
  // =====================================
  // 1. QUERY REWRITING
  // =====================================

  const rewrittenQuery = await rewriteQuery(question);

  // =====================================
  // 2. MULTI-QUERY GENERATION
  // =====================================

  const searchQueries = await generateMultipleQueries(
    question,
    rewrittenQuery
  );

  console.log("\nMulti Query Retrieval:", searchQueries);

  // =====================================
  // 3. MULTI-QUERY VECTOR RETRIEVAL
  // =====================================

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

  // =====================================
  // 4. DEDUPLICATION
  // =====================================

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
      ...new Set([
        ...existing.retrievedBy,
        ...result.retrievedBy,
      ]),
    ];

    // Keep the best similarity result
    if (result.distance < existing.distance) {
      uniqueResultsMap.set(result.id, {
        ...result,
        retrievedBy,
      });
    } else {
      existing.retrievedBy = retrievedBy;
    }
  }

  const mergedResults = [...uniqueResultsMap.values()].sort(
    (a, b) => a.distance - b.distance
  );

  // =====================================
  // 5. SIMILARITY THRESHOLD
  // =====================================

  const relevantDocuments = mergedResults.filter(
    (result) =>
      result.distance <= SIMILARITY_THRESHOLD
  );

  if (relevantDocuments.length === 0) {
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

  // =====================================
  // 6. RERANKING
  // =====================================

  console.log(
    `\nReranking ${relevantDocuments.length} documents...`
  );

  const rerankedDocuments = await rerankDocuments(
    question,
    relevantDocuments
  );

  console.log(
    "Reranking completed:",
    rerankedDocuments.map((document) => ({
      id: document.id,
      rerankScore: document.rerankScore,
    }))
  );

  // =====================================
  // 7. RERANK THRESHOLD
  // =====================================

  const filteredRerankedDocuments =
    rerankedDocuments.filter(
      (document) =>
        document.rerankScore >= RERANK_THRESHOLD
    );

  // No documents passed reranking threshold
  if (filteredRerankedDocuments.length === 0) {
    return {
      success: true,

      answer:
        "I couldn't find sufficiently relevant information to answer your question.",

      originalQuestion: question,

      rewrittenQuery,

      searchQueries,

      sources: [],

      retrievalResults: rawRetrievalResults,
    };
  }

  // =====================================
  // 8. SELECT FINAL DOCUMENTS
  // =====================================

  const sources =
    filteredRerankedDocuments.slice(
      0,
      FINAL_DOCUMENT_LIMIT
    );

  console.log(
    `\nSelected ${sources.length} final documents`
  );

  // =====================================
  // 9. CONTEXT COMPRESSION 🔥
  // =====================================

  console.log(
    "\nCompressing retrieved context..."
  );

  const compressedSources = compressContext(
    question,
    sources
  );

  // =====================================
  // 10. BUILD COMPRESSED CONTEXT
  // =====================================

  const context = compressedSources
    .map(
      (result, index) =>
        `Source ${index + 1}:\n${result.document}`
    )
    .join("\n\n");

  console.log(
    "\nCompressed context ready for LLM"
  );

  // =====================================
  // 11. GENERATE FINAL ANSWER
  // =====================================

  const answer = await generateAnswer(
    question,
    context
  );

  // =====================================
  // FINAL RESPONSE
  // =====================================

  return {
    success: true,

    answer,

    originalQuestion: question,

    rewrittenQuery,

    searchQueries,

    // Return compressed sources for UI
    sources: compressedSources,

    // Keep raw results for debugging
    retrievalResults: rawRetrievalResults,
  };
}

export async function askRAG(
  question,
  topic = "all"
) {
  return processRAGQuestion(
    question,
    topic
  );
}