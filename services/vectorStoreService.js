import chromaClient from "../config/chroma.js";

const COLLECTION_NAME = "rag_documents";

// Get Collection
export async function getCollection() {
  return await chromaClient.getCollection({
    name: COLLECTION_NAME,
  });
}

// Check whether a document already exists
export async function documentExists(documentId) {
  const collection = await getCollection();

  const result = await collection.get({
    ids: [documentId],
  });

  return result.ids.length > 0;
}

// Store document with embedding
export async function addDocument({
  id,
  content,
  embedding,
  metadata,
}) {
  const collection = await getCollection();

  await collection.add({
    ids: [id],
    documents: [content],
    embeddings: [embedding],
    metadatas: [metadata],
  });
}

// Semantic vector search
export async function searchVectors(
  queryEmbedding,
  nResults = 3
) {
  const collection = await getCollection();

  return await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
    include: ["documents", "metadatas", "distances"],
  });
}