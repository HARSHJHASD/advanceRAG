import ai from "../config/gemini.js";
import {
  cacheKey,
  getCached,
  setCached,
} from "./cacheService.js";
import { withRetry } from "./retryService.js";

const EMBEDDING_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function generateEmbedding(text) {
  const key = cacheKey(text);
  const cachedEmbedding = getCached("embeddings", key);

  if (cachedEmbedding) {
    return cachedEmbedding;
  }

  const response = await withRetry(() =>
    ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    })
  );

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding) {
    throw new Error("Gemini did not return an embedding.");
  }

  setCached("embeddings", key, embedding, EMBEDDING_CACHE_TTL_MS);

  return embedding;
}
