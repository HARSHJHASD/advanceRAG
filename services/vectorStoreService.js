import { chromaClient } from "../config/chroma.js";

const COLLECTION_NAME = "rag_documents";
const BM25_K1 = 1.2;
const BM25_B = 0.75;
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "how", "in", "is", "it", "of", "on", "or", "that", "the", "to",
  "what", "when", "where", "which", "with",
]);

function tokenize(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]*/gu) || [])
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));
}

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

export async function searchSimilarDocuments({
  embedding,
  topic = "all",
  limit = 5,
}) {
  const results = await searchDocuments(
    embedding,
    limit,
    topic !== "all" ? { topic } : null
  );

  const documents = results.documents?.[0] || [];
  const ids = results.ids?.[0] || [];
  const distances = results.distances?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];

  return documents.map((document, index) => ({
    id: ids[index],
    document,
    distance: distances[index],
    metadata: metadatas[index],
  }));
}

// =====================================
// KEYWORD SEARCH
// =====================================

export async function getAllDocuments(topic = "all") {
  const collection = await getCollection();

  const options = {
    include: ["documents", "metadatas"],
  };

  if (topic !== "all") {
    options.where = {
      topic,
    };
  }

  const results = await collection.get(options);

  const documents = results.documents || [];
  const ids = results.ids || [];
  const metadatas = results.metadatas || [];

  return documents.map((document, index) => ({
    id: ids[index],
    document,
    metadata: metadatas[index],
  }));
}

// =====================================
// KEYWORD SEARCH
// =====================================

export async function searchByKeywords({
  query,
  topic = "all",
  limit = 5,
}) {
  const documents = await getAllDocuments(topic);

  const queryTerms = [...new Set(tokenize(query))];

  if (!queryTerms.length || !documents.length) {
    return [];
  }

  const indexedDocuments = documents.map((item) => {
    const terms = tokenize(item.document);
    const termFrequencies = new Map();

    for (const term of terms) {
      termFrequencies.set(term, (termFrequencies.get(term) || 0) + 1);
    }

    return { ...item, length: terms.length, termFrequencies };
  });

  const averageDocumentLength = Math.max(
    1,
    indexedDocuments.reduce((total, item) => total + item.length, 0) /
      indexedDocuments.length
  );

  const documentFrequency = new Map();
  for (const item of indexedDocuments) {
    for (const term of item.termFrequencies.keys()) {
      documentFrequency.set(
        term,
        (documentFrequency.get(term) || 0) + 1
      );
    }
  }

  return indexedDocuments
    .map(({ length, termFrequencies, ...item }) => {
      const bm25Score = queryTerms.reduce((score, term) => {
        const frequency = termFrequencies.get(term) || 0;

        if (!frequency) {
          return score;
        }

        const frequencyInCorpus = documentFrequency.get(term) || 0;
        const inverseDocumentFrequency = Math.log(
          1 +
            (indexedDocuments.length - frequencyInCorpus + 0.5) /
              (frequencyInCorpus + 0.5)
        );
        const normalizedFrequency =
          frequency +
          BM25_K1 *
            (1 - BM25_B + BM25_B * (length / averageDocumentLength));

        return (
          score +
          inverseDocumentFrequency *
            ((frequency * (BM25_K1 + 1)) / normalizedFrequency)
        );
      }, 0);

      return { ...item, bm25Score };
    })
    .filter((item) => item.bm25Score > 0)
    .sort((a, b) => b.bm25Score - a.bm25Score)
    .slice(0, limit);
}
