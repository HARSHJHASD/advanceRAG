import ai from "../config/gemini.js";

export async function generateEmbedding(text) {
  try {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });

    return response.embeddings[0].values;
  } catch (error) {
    console.error("Embedding Error:", error);
    throw error;
  }
}