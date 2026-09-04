import { rewriteQuery } from "./queryRewritingService.js";
import { generateMultipleQueries } from "./multiQueryService.js";
import { searchSimilarDocuments } from "./vectorStoreService.js";
import { generateEmbedding } from "./embeddingService.js";
import { generateAnswer } from "./geminiService.js";
import { rerankDocuments } from "./rerankingService.js";
import { compressContext } from "./contextCompressionService.js";

import {
  getConversationHistory,
  addMessage,
} from "./conversationService.js";

const SIMILARITY_THRESHOLD = 1.1;
const RERANK_THRESHOLD = 60;
const FINAL_DOCUMENT_LIMIT = 3;

export async function processRAGQuestion(
  question,
  topic = "all",
  sessionId = "default-session"
) {
  // =====================================
  // 1. GET CONVERSATION HISTORY
  // =====================================

  const history = getConversationHistory(sessionId);

  console.log(
    `\nConversation History for ${sessionId}:`,
    history
  );

  // Save the current user question
  addMessage(sessionId, "user", question);

  // =====================================
  // 2. QUERY REWRITING
  // =====================================

  const rewrittenQuery = await rewriteQuery(
    question,
    history
  );

  // =====================================
  // 3. MULTI-QUERY GENERATION
  // =====================================

  const searchQueries = await generateMultipleQueries(
    question,
    rewrittenQuery
  );

  console.log("\nMulti Query Retrieval:", searchQueries);

  // =====================================
  // 4. MULTI-QUERY VECTOR RETRIEVAL
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
  // 5. DEDUPLICATION
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

    // Keep the best vector similarity score
    if (result.distance < existing.distance) {
      uniqueResultsMap.set(result.id, {
        ...result,
        retrievedBy,
      });
    } else {
      existing.retrievedBy = retrievedBy;
    }
  }

  const mergedResults = [
    ...uniqueResultsMap.values(),
  ].sort((a, b) => a.distance - b.distance);

  // =====================================
  // 6. SIMILARITY THRESHOLD
  // =====================================

  const relevantDocuments = mergedResults.filter(
    (result) =>
      result.distance <= SIMILARITY_THRESHOLD
  );

  // =====================================
  // NO RELEVANT DOCUMENTS
  // =====================================

  if (relevantDocuments.length === 0) {
    const answer =
      "I couldn't find relevant information in the selected documents.";

    // Save assistant response
    addMessage(sessionId, "assistant", answer);

    return {
      success: true,
      answer,
      originalQuestion: question,
      rewrittenQuery,
      searchQueries,
      sources: [],
      retrievalResults: rawRetrievalResults,
    };
  }

  // =====================================
  // 7. RERANKING
  // =====================================

  console.log(
    `\nReranking ${relevantDocuments.length} documents...`
  );

  const rerankedDocuments = await rerankDocuments(
    rewrittenQuery,
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
  // 8. RERANK THRESHOLD
  // =====================================

  const filteredRerankedDocuments =
    rerankedDocuments.filter(
      (document) =>
        document.rerankScore === null ||
        document.rerankScore >= RERANK_THRESHOLD
    );

  // =====================================
  // NO DOCUMENTS PASSED RERANKING
  // =====================================

  if (filteredRerankedDocuments.length === 0) {
    const answer =
      "I couldn't find sufficiently relevant information to answer your question.";

    // Save assistant response
    addMessage(sessionId, "assistant", answer);

    return {
      success: true,
      answer,
      originalQuestion: question,
      rewrittenQuery,
      searchQueries,
      sources: [],
      retrievalResults: rawRetrievalResults,
    };
  }

  // =====================================
  // 9. SELECT FINAL DOCUMENTS
  // =====================================

  const sources = filteredRerankedDocuments.slice(
    0,
    FINAL_DOCUMENT_LIMIT
  );

  console.log(
    `\nSelected ${sources.length} final documents`
  );

  // =====================================
  // 10. CONTEXT COMPRESSION
  // =====================================

  console.log("\nCompressing context...");

  const compressedSources = compressContext(
    rewrittenQuery,
    sources
  );

  // =====================================
  // 11. BUILD COMPRESSED CONTEXT
  // =====================================

  const context = compressedSources
    .map(
      (result, index) =>
        `Source ${index + 1}:\n${result.document}`
    )
    .join("\n\n");

  // =====================================
  // 12. GENERATE FINAL ANSWER
  // =====================================

  const answer = await generateAnswer(
    rewrittenQuery,
    context
  );

  // =====================================
  // 13. SAVE ASSISTANT RESPONSE
  // =====================================

  addMessage(sessionId, "assistant", answer);

  // =====================================
  // FINAL RESPONSE
  // =====================================

  return {
    success: true,
    answer,
    originalQuestion: question,
    rewrittenQuery,
    searchQueries,
    sources: compressedSources,
    retrievalResults: rawRetrievalResults,
  };
}

export async function askRAG(
  question,
  topic = "all",
  sessionId = "default-session"
) {
  return processRAGQuestion(
    question,
    topic,
    sessionId
  );
}
