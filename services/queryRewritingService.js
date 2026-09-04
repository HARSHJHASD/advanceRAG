import { ai } from "../config/gemini.js";

export async function rewriteQuery(question, history = []) {
  // A standalone question is already a valid retrieval query. Preserve Gemini
  // quota for the answer unless there is conversation context to resolve.
  if (history.length === 0 && process.env.USE_LLM_QUERY_REWRITING !== "true") {
    return question;
  }

  try {
    const conversation = history.length
      ? history
          .map(({ role, content }) => `${role}: ${content}`)
          .join("\n")
      : "No previous conversation.";

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
7. Use the conversation only to resolve references such as "it", "that",
   or "how does it work". Do not carry over unrelated earlier topics.

Conversation so far:
${conversation}

User question:
${question}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const rewrittenQuery = response.text?.trim();

    console.log("\n🔄 QUERY REWRITING");
    console.log("Original Query:", question);
    console.log("Rewritten Query:", rewrittenQuery);
    console.log("--------------------------\n");

    return rewrittenQuery || question;
  } catch (error) {
    console.error(
      "Query Rewriting Error:",
      error.message
    );

    return question;
  }
}
