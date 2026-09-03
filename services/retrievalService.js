import { generateEmbedding } from "./embeddingService.js";
import { searchDocuments } from "./vectorStoreService.js";

// Starting threshold
// Lower distance = better match
const DISTANCE_THRESHOLD = 0.7;

export async function retrieveDocuments(question) {
  console.log("\n========== RETRIEVAL STARTED ==========");

  // Step 1: Generate embedding for user question
  console.log("Generating question embedding...");

  const queryEmbedding =
    await generateEmbedding(question);

  console.log(
    "Question embedding generated successfully."
  );

  // Step 2: Search ChromaDB
  console.log(
    "Searching ChromaDB for relevant documents..."
  );

  const results = await searchDocuments(
    queryEmbedding,
    5
  );

  // Extract ChromaDB response
  const documents =
    results.documents?.[0] || [];

  const distances =
    results.distances?.[0] || [];

  const metadatas =
    results.metadatas?.[0] || [];

  const ids =
    results.ids?.[0] || [];

  // Step 3: Combine results
  const retrievedDocuments = documents.map(
    (document, index) => ({
      id: ids[index],
      document,
      distance: distances[index],
      metadata: metadatas[index],
    })
  );

  // Show all retrieved documents
  console.log("\n--- ALL RETRIEVED DOCUMENTS ---");

  retrievedDocuments.forEach((item, index) => {
    console.log(`\nResult ${index + 1}`);

    console.log(
      "Document:",
      item.document
    );

    console.log(
      "Distance:",
      item.distance
    );
  });

  // Step 4: Apply similarity threshold
  const relevantDocuments =
    retrievedDocuments.filter((item) => {
      return item.distance <= DISTANCE_THRESHOLD;
    });

  console.log(
    "\n--- RELEVANT DOCUMENTS ---"
  );

  relevantDocuments.forEach((item, index) => {
    console.log(`\nRelevant Result ${index + 1}`);

    console.log(
      "Distance:",
      item.distance
    );

    console.log(
      "Document:",
      item.document
    );
  });

  console.log(
    "\nTotal Retrieved:",
    retrievedDocuments.length
  );

  console.log(
    "Total Relevant:",
    relevantDocuments.length
  );

  console.log(
    "========== RETRIEVAL COMPLETED ==========\n"
  );

  return {
    allResults: retrievedDocuments,
    relevantResults: relevantDocuments,
  };
}