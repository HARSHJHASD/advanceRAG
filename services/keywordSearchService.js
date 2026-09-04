export function keywordSearch(query, documents) {
  // Convert the query into searchable keywords
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const scoredDocuments = documents.map((document) => {
    const text = document.document.toLowerCase();

    let keywordScore = 0;

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        keywordScore++;
      }
    }

    return {
      ...document,
      keywordScore,
    };
  });

  return scoredDocuments
    .filter((document) => document.keywordScore > 0)
    .sort(
      (a, b) =>
        b.keywordScore - a.keywordScore
    );
}