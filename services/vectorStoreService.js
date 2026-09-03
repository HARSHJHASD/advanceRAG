import chromaClient from "../config/chroma.js";

const COLLECTION_NAME = "rag_documents";

export async function getCollection() {
  const collection = await chromaClient.getCollection({
    name: COLLECTION_NAME,
  });

  return collection;
}

export async function searchVectors(
  queryEmbedding,
  nResults = 5
) {
  const collection = await getCollection();

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
    include: [
      "documents",
      "metadatas",
      "distances",
    ],
  });

  return results;
}