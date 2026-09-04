import ai from "../config/gemini.js";

export async function generateAnswer(question, context) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",

      contents: `
Answer the question using only the provided context.

If the context does not contain the answer, say so clearly.

Context:
${context}

Question:
${question}
`,
    });

    return response.text;
  } catch (error) {
    if (error.status === 429) {
      return `Based on the retrieved context:\n\n${context}`;
    }

    throw error;
  }
}

// =====================================
// Generic Gemini Content Generation
// Used for Query Rewriting, Reranking, etc.
// =====================================

export async function generateContent(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",

      contents: prompt,
    });

    return response.text;
  } catch (error) {
    throw error;
  }
}