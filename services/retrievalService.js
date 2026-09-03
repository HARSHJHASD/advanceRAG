import { generateEmbedding } from "./embeddingService.js";

import { searchVectors } from "./vectorStoreService.js";

export async function retrieveDocuments(question) {
  // Generate embedding for question
  const queryEmbedding =
    await generateEmbedding(question);

  // Search vector database
  const results =
    await searchVectors(queryEmbedding, 3);

  return results;
} 