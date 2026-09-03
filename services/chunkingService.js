export function chunkDocument(
  text,
  chunkSize = 500,
  chunkOverlap = 100
) {
  const chunks = [];

  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;

    const chunk = text
      .slice(start, end)
      .trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start += chunkSize - chunkOverlap;
  }

  return chunks;
}