import { ai } from "../config/gemini.js";

function normalizeQuery(query) {
  return query
    .toLowerCase()
    .replace(/^[\d\s.)-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueQueries(queries) {
  const seen = new Set();

  return queries.filter((query) => {
    const normalized = normalizeQuery(query);

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function fallbackQueries(originalQuery, rewrite) {
  return uniqueQueries([
    originalQuery,
    rewrite,
    `Key concepts, facts, and details about: ${originalQuery}`,
    `How it works, causes, and implications of: ${originalQuery}`,
  ]).slice(0, 3);
}

export async function generateMultipleQueries(question, rewrittenQuery) {
  const originalQuery = question.trim();
  const rewrite = (rewrittenQuery || originalQuery).trim();

  // Deterministic query perspectives provide multi-query retrieval without an
  // additional model request. Set USE_LLM_MULTI_QUERY=true to enable Gemini
  // generated variants when quota permits.
  if (process.env.USE_LLM_MULTI_QUERY !== "true") {
    return fallbackQueries(originalQuery, rewrite);
  }

  try {
    const prompt = `
You generate diverse semantic-search queries for a RAG application.

Return exactly TWO concise queries for the question below. They must preserve
the question's intent, but each must use a different retrieval perspective
(for example, definitions/concepts, mechanisms/how-it-works, comparisons,
causes, or practical details). Do not answer the question. Do not repeat the
original question or this rewritten search query:
"${rewrite}"

Return only the two queries, one per line, with no numbering or bullets.

Original question:
${originalQuery}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const generatedQueries = (response.text || "")
      .split("\n")
      .map((query) => query.trim())
      .filter(Boolean);

    const queries = uniqueQueries([
      originalQuery,
      ...generatedQueries,
      ...fallbackQueries(originalQuery, rewrite),
    ]).slice(0, 3);

    console.log("\nMULTI-QUERY GENERATION");
    queries.forEach((query, index) => {
      console.log(`Query ${index + 1}: ${query}`);
    });
    console.log("--------------------------\n");

    return queries;
  } catch (error) {
    console.error("Multi Query Generation Error:", error.message);

    return fallbackQueries(originalQuery, rewrite);
  }
}
