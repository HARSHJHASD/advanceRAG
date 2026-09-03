import { chromaClient } from "../config/chroma.js";

const COLLECTION_NAME = "rag_documents";

// =========================
// GET COLLECTION
// =========================

export async function getCollection() {
  return await chromaClient.getCollection({
    name: COLLECTION_NAME,
  });
}

// =========================
// GET DOCUMENT BY ID
// =========================

export async function getDocumentById(id) {
  const collection = await getCollection();

  return await collection.get({
    ids: [id],
  });
}

// =========================
// STORE DOCUMENT
// =========================

export async function storeDocument({
  id,
  document,
  embedding,
  metadata,
}) {
  const collection = await getCollection();

  await collection.add({
    ids: [id],
    documents: [document],
    embeddings: [embedding],
    metadatas: [metadata],
  });
}

// =========================
// SEARCH DOCUMENTS
// =========================

export async function searchDocuments(
  queryEmbedding,
  numberOfResults = 5
) {
  const collection = await getCollection();

  return await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: numberOfResults,
  });
}