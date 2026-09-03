import { chromaClient } from "../config/chroma.js";

const COLLECTION_NAME = "rag_documents";

export async function getCollection() {
  return await chromaClient.getCollection({
    name: COLLECTION_NAME,
  });
}

export async function getDocumentById(id) {
  const collection = await getCollection();

  return await collection.get({
    ids: [id],
  });
}

export async function storeDocument({
  id,
  document,
  embedding,
  metadata,
}) {
  const collection = await getCollection();

  await collection.upsert({
    ids: [id],
    documents: [document],
    embeddings: [embedding],
    metadatas: [metadata],
  });
}

export async function searchDocuments(
  queryEmbedding,
  numberOfResults = 5,
  metadataFilter = null
) {
  const collection = await getCollection();

  const queryOptions = {
    queryEmbeddings: [queryEmbedding],
    nResults: numberOfResults,
  };

  if (metadataFilter) {
    queryOptions.where = metadataFilter;
  }

  return await collection.query(queryOptions);
}