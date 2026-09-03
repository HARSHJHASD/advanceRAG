import ai from "../config/gemini.js";

import {
  retrieveDocuments,
} from "./retrievalService.js";

export async function askRAG(question) {
  // Retrieve relevant documents
  const searchResults =
    await retrieveDocuments(question);

  const documents =
    searchResults.documents?.[0] || [];

  // If no documents are found
  if (documents.length === 0) {
    return {
      answer:
        "I don't have enough information in the provided documents.",
      sources: [],
    };
  }

  // Create context
  const context =
    documents
      .map((document, index) => {
        return `[Source ${index + 1}]\n${document}`;
      })
      .join("\n\n");

  // Create RAG Prompt
  const prompt = `
You are a helpful AI assistant.

Answer the user's question using ONLY the provided context.

If the answer is not available in the context, clearly say:

"I don't have enough information in the provided documents."

Context:
${context}

User Question:
${question}

Answer:
`;

  // Generate answer
  const response =
    await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

  return {
    answer: response.text,
    sources: documents,
  };
}