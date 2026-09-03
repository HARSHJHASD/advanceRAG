import { generateEmbedding } from "./embeddingService.js";
import { searchDocuments } from "./vectorStoreService.js";
import { generateAnswer } from "./geminiService.js";

const SIMILARITY_THRESHOLD = 0.7;

export async function askRAG(question, topic = null) {
  // 1. Generate query embedding
  const queryEmbedding =
    await generateEmbedding(question);

  // 2. Create metadata filter
  let metadataFilter = null;

  if (topic && topic !== "all") {
    metadataFilter = {
      topic: topic,
    };
  }

  // 3. Search vector database
  const searchResults =
    await searchDocuments(
      queryEmbedding,
      5,
      metadataFilter
    );

  const documents =
    searchResults.documents?.[0] || [];

  const distances =
    searchResults.distances?.[0] || [];

  const metadatas =
    searchResults.metadatas?.[0] || [];

  // 4. Apply similarity threshold
  const retrievedDocuments = documents
    .map((document, index) => ({
      document,
      distance: distances[index],
      metadata: metadatas[index],
    }));

  const relevantDocuments = retrievedDocuments.filter(
    (item) =>
      typeof item.distance === "number" &&
      item.distance <= SIMILARITY_THRESHOLD
  );

  // Keep the closest result available when the configured cutoff is too strict
  // for the embedding model, instead of returning no answer for a valid query.
  if (
    relevantDocuments.length === 0 &&
    retrievedDocuments.length > 0
  ) {
    const closestDocument = retrievedDocuments.reduce(
      (closest, item) =>
        item.distance < closest.distance
          ? item
          : closest
    );

    relevantDocuments.push(closestDocument);
  }

  // No relevant documents
  if (relevantDocuments.length === 0) {
    return {
      answer:
        "I couldn't find relevant information in the selected documents.",
      sources: [],
    };
  }

  // 5. Build context
  const context = relevantDocuments
    .map(
      (item, index) =>
        `Source ${index + 1}:
${item.document}`
    )
    .join("\n\n");

  // 6. Generate answer
  const answer = await generateAnswer(
    question,
    context
  );

  return {
    answer,
    sources: relevantDocuments,
  };
}