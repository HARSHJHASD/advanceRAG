import { rewriteQuery } from "./queryRewritingService.js";
import { generateMultipleQueries } from "./multiQueryService.js";

import {
  searchSimilarDocuments,
  searchByKeywords,
} from "./vectorStoreService.js";

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
const RRF_K = 60;

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

  console.log(
    "\nMulti Query Retrieval:",
    searchQueries
  );

  // =====================================
  // 4. HYBRID RETRIEVAL
  // VECTOR SEARCH + KEYWORD SEARCH
  // =====================================

  const rawRetrievalResults = [];

  for (const query of searchQueries) {
    console.log(`\nHybrid search for: ${query}`);

    // -------------------------------------
    // A. VECTOR SEARCH
    // -------------------------------------

    const embedding = await generateEmbedding(query);

    const vectorResults =
      await searchSimilarDocuments({
        embedding,
        topic,
        limit: 5,
      });

    rawRetrievalResults.push(
      ...vectorResults.map((result, index) => ({
        ...result,
        searchType: "vector",
        rank: index + 1,
        rrfScore: 1 / (RRF_K + index + 1),
        retrievedBy: [query],
      }))
    );

    // -------------------------------------
    // B. KEYWORD SEARCH
    // -------------------------------------

    const keywordResults =
      await searchByKeywords({
        query,
        topic,
        limit: 5,
      });

    rawRetrievalResults.push(
      ...keywordResults.map((result, index) => ({
        ...result,
        distance: null,
        searchType: "keyword",
        rank: index + 1,
        rrfScore: 1 / (RRF_K + index + 1),
        retrievedBy: [query],
      }))
    );
  }

  console.log(
    `\nTotal hybrid retrieval results: ${rawRetrievalResults.length}`
  );

  // =====================================
  // 5. DEDUPLICATION + HYBRID MERGING
  // =====================================

  const uniqueResultsMap = new Map();

  for (const result of rawRetrievalResults) {
    const existing =
      uniqueResultsMap.get(result.id);

    // -------------------------------------
    // FIRST OCCURRENCE
    // -------------------------------------

    if (!existing) {
      uniqueResultsMap.set(result.id, {
        ...result,

        retrievedBy: [
          ...result.retrievedBy,
        ],

        searchTypes: [result.searchType],
      });

      continue;
    }

    // -------------------------------------
    // MERGE RETRIEVAL QUERIES
    // -------------------------------------

    const retrievedBy = [
      ...new Set([
        ...existing.retrievedBy,
        ...result.retrievedBy,
      ]),
    ];

    // -------------------------------------
    // MERGE SEARCH TYPES
    // -------------------------------------

    const searchTypes = [
      ...new Set([
        ...existing.searchTypes,
        result.searchType,
      ]),
    ];

    // -------------------------------------
    // KEEP BEST VECTOR DISTANCE
    // -------------------------------------

    let distance = existing.distance;

    if (
      typeof result.distance === "number" &&
      (
        typeof existing.distance !== "number" ||
        result.distance < existing.distance
      )
    ) {
      distance = result.distance;
    }

    const bm25Score = Math.max(
      existing.bm25Score || 0,
      result.bm25Score || 0
    );

    uniqueResultsMap.set(result.id, {
      ...existing,
      retrievedBy,
      searchTypes,
      distance,
      bm25Score,
      rrfScore: existing.rrfScore + result.rrfScore,
    });
  }

  const mergedResults = [...uniqueResultsMap.values()].sort(
    (a, b) => b.rrfScore - a.rrfScore
  );

  console.log(
    `Unique hybrid results: ${mergedResults.length}`
  );

  // =====================================
  // 6. SIMILARITY FILTER
  // =====================================

  // Keyword-only matches are eligible. A chunk that was retrieved by vector
  // search must still meet the configured vector-distance threshold.

  const relevantDocuments =
    mergedResults.filter((result) => {
      if (typeof result.distance === "number") {
        return result.distance <= SIMILARITY_THRESHOLD;
      }

      return result.searchTypes.includes("keyword");
    });

  if (relevantDocuments.length === 0) {
    const answer =
      "I couldn't find relevant information in the selected documents.";

    addMessage(
      sessionId,
      "assistant",
      answer
    );

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
    `\nReranking ${relevantDocuments.length} hybrid results...`
  );

  const rerankedDocuments =
    await rerankDocuments(
      rewrittenQuery,
      relevantDocuments
    );

  console.log(
    "Reranking completed:",
    rerankedDocuments.map(
      (document) => ({
        id: document.id,
        rerankScore:
          document.rerankScore,
        searchTypes:
          document.searchTypes,
      })
    )
  );

  // =====================================
  // 8. RERANK THRESHOLD
  // =====================================

  const filteredRerankedDocuments =
    rerankedDocuments.filter(
      (document) =>
        document.rerankScore === null ||
        document.rerankScore >=
          RERANK_THRESHOLD
    );

  if (
    filteredRerankedDocuments.length === 0
  ) {
    const answer =
      "I couldn't find sufficiently relevant information to answer your question.";

    addMessage(
      sessionId,
      "assistant",
      answer
    );

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

  const sources =
    filteredRerankedDocuments.slice(
      0,
      FINAL_DOCUMENT_LIMIT
    );

  console.log(
    `\nSelected ${sources.length} final documents`
  );

  // =====================================
  // 10. CONTEXT COMPRESSION
  // =====================================

  console.log(
    "\nCompressing context..."
  );

  const compressedSources =
    compressContext(
      rewrittenQuery,
      sources
    );

  // =====================================
  // 11. BUILD CONTEXT
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

  const answer =
    await generateAnswer(
      rewrittenQuery,
      context
    );

  // =====================================
  // 13. SAVE CONVERSATION
  // =====================================

  addMessage(
    sessionId,
    "assistant",
    answer
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
