export function compressContext(question, documents) {
  const questionWords = question
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  return documents.map((document) => {
    const sentences = document.document
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => sentence.trim().length > 0);

    const scoredSentences = sentences.map((sentence) => {
      const lowerCaseSentence = sentence.toLowerCase();

      let score = 0;

      for (const word of questionWords) {
        if (lowerCaseSentence.includes(word)) {
          score++;
        }
      }

      return {
        sentence,
        score,
      };
    });

    const relevantSentences = scoredSentences
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.sentence);

    return {
      ...document,

      originalDocument: document.document,

      document:
        relevantSentences.length > 0
          ? relevantSentences.join(" ")
          : document.document,
    };
  });
}