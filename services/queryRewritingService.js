import { ai } from "../config/gemini.js";

export async function rewriteQuery(question) {
  try {
    const prompt = `
You are a search query rewriting system.

Your job is to convert the user's question into a clear and
specific search query that will be used for semantic search
inside a vector database.

Rules:

1. Preserve the user's original meaning.
2. Do not answer the question.
3. Do not invent information.
4. Make vague questions more explicit when possible.
5. Keep the rewritten query concise.
6. Return only the rewritten query.

User question:
${question}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const rewrittenQuery = response.text?.trim();

    if (!rewrittenQuery) {
      return question;
    }

    return rewrittenQuery;
  } catch (error) {
    console.error(
      "Query Rewriting Error:",
      error.message
    );

    // Fallback to original question
    return question;
  }
}