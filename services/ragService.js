import ai from "../config/gemini.js";

import {
  retrieveDocuments,
} from "./retrievalService.js";

export async function askRAG(question) {
  console.log(
    "\n========== RAG PROCESS STARTED =========="
  );

  console.log(
    "User Question:",
    question
  );

  // =========================
  // STEP 1: RETRIEVE DOCUMENTS
  // =========================

  const retrievalResult =
    await retrieveDocuments(question);

  const relevantDocuments =
    retrievalResult.relevantResults;

  // =========================
  // STEP 2: HANDLE NO RESULTS
  // =========================

  if (relevantDocuments.length === 0) {
    console.log(
      "No relevant documents passed the threshold."
    );

    return {
      answer:
        "I don't have enough relevant information in my knowledge base to answer this question.",

      sources: [],

      retrievalResults:
        retrievalResult.allResults,
    };
  }

  // =========================
  // STEP 3: BUILD CONTEXT
  // =========================

  const context =
    relevantDocuments
      .map((item, index) => {
        return `
[Source ${index + 1}]
${item.document}
        `;
      })
      .join("\n\n");

  console.log(
    "\n--- FINAL CONTEXT ---"
  );

  console.log(context);

  // =========================
  // STEP 4: CREATE PROMPT
  // =========================

  const prompt = `
You are a helpful AI assistant.

Answer the user's question using ONLY the provided context.

Do not use information outside the context.

If the answer cannot be found in the context, say:

"I don't have enough information in the provided documents."

====================
CONTEXT
====================

${context}

====================
QUESTION
====================

${question}

====================
ANSWER
====================
`;

  // =========================
  // STEP 5: GENERATE ANSWER
  // =========================

  console.log(
    "\nSending relevant context to Gemini..."
  );

  const response =
    await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

  console.log(
    "Gemini generated answer successfully."
  );

  console.log(
    "========== RAG PROCESS COMPLETED ==========\n"
  );

  // =========================
  // RETURN RESPONSE
  // =========================

  return {
    answer: response.text,

    sources: relevantDocuments,

    retrievalResults:
      retrievalResult.allResults,
  };
}