function tokenize(text) {
  return new Set(
    (text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]*/gu) || [])
      .filter((word) => word.length > 2)
  );
}

function similarity(first, second) {
  if (!first.size || !second.size) {
    return 0;
  }

  const shared = [...first].filter((word) => second.has(word)).length;
  return shared / Math.sqrt(first.size * second.size);
}

function splitIntoSentences(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

// Local semantic-aware chunking: preserve sentence/paragraph boundaries and
// start a new chunk at low lexical-cohesion topic changes. It avoids LLM calls
// during ingestion while producing more coherent chunks than fixed characters.
export function chunkDocument(text, chunkSize = 500, chunkOverlap = 100) {
  const sentences = splitIntoSentences(text);
  const chunks = [];
  let current = [];
  let currentLength = 0;
  let previousTerms = null;

  const flush = () => {
    if (!current.length) {
      return;
    }

    chunks.push(current.join(" "));

    const overlap = [];
    let overlapLength = 0;

    for (const sentence of [...current].reverse()) {
      if (overlapLength + sentence.length > chunkOverlap && overlap.length) {
        break;
      }

      overlap.unshift(sentence);
      overlapLength += sentence.length + 1;
    }

    current = overlap;
    currentLength = overlapLength;
  };

  for (const sentence of sentences) {
    const terms = tokenize(sentence);
    const changesTopic =
      current.length > 0 &&
      similarity(previousTerms, terms) < 0.08;
    const exceedsTarget =
      current.length > 0 && currentLength + sentence.length + 1 > chunkSize;

    if (changesTopic || exceedsTarget) {
      flush();
    }

    // Preserve very long sentences rather than splitting a concept in half.
    current.push(sentence);
    currentLength += sentence.length + 1;
    previousTerms = terms;
  }

  if (current.length) {
    chunks.push(current.join(" "));
  }

  return chunks;
}
