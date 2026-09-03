import { generateEmbedding } from "./embeddingService.js";

import {
  searchSimilarDocuments,
} from "./vectorStoreService.js";

import {
  generateAnswer,
} from "./answerService.js";

import {
  rewriteQuery,
} from "./queryRewritingService.js";

// =========================
// Similarity Threshold
// =========================

const SIMILARITY_THRESHOLD = 1.2;

// =========================
// Process RAG Question
// =========================

export async function processQuestion(
  question,
  topic = "all"
) {
  try {
    console.log("\n========== RAG PIPELINE ==========");

    console.log(
      "Original Question:",
      question
    );

    // =========================
    // STEP 1
    // Query Rewriting
    // =========================

    const rewrittenQuestion =
      await rewriteQuery(question);

    console.log(
      "Rewritten Question:",
      rewrittenQuestion
    );

    // =========================
    // STEP 2
    // Generate Query Embedding
    // =========================

    const queryEmbedding =
      await generateEmbedding(
        rewrittenQuestion
      );

    console.log(
      "Query embedding generated"
    );

    // =========================
    // STEP 3
    // Semantic Search
    // =========================

    const retrievalResults =
      await searchSimilarDocuments({
        embedding: queryEmbedding,
        topic,
        limit: 5,
      });

    console.log(
      "Documents retrieved:",
      retrievalResults.length
    );

    // =========================
    // STEP 4
    // Similarity Threshold
    // =========================

    const relevantDocuments =
      retrievalResults.filter(
        (item) =>
          item.distance <=
          SIMILARITY_THRESHOLD
      );

    console.log(
      "Relevant documents:",
      relevantDocuments.length
    );

    // =========================
    // STEP 5
    // Generate Answer
    // =========================

    const answer = await generateAnswer({
      question,
      context: relevantDocuments,
    });

    console.log(
      "Answer generated"
    );

    console.log(
      "==================================\n"
    );

    return {
      success: true,

      answer,

      originalQuestion: question,

      rewrittenQuestion,

      sources: relevantDocuments,

      retrievalResults,
    };
  } catch (error) {
    console.error(
      "RAG Processing Error:",
      error
    );

    throw error;
  }
}

export async function askRAG(question, topic = "all") {
  return processQuestion(question, topic);
}