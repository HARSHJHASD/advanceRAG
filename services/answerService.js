import { ai } from "../config/gemini.js";

export async function generateAnswer({
  question,
  context,
}) {
  // =========================
  // No Context
  // =========================

  if (!context || context.length === 0) {
    return "I couldn't find relevant information in the selected documents.";
  }

  // =========================
  // Prepare Context
  // =========================

  const contextText =
    context
      .map(
        (item, index) => `
Source ${index + 1}:

${item.document}
`
      )
      .join("\n");

  try {
    const prompt = `
Answer the user's question using ONLY
the provided context.

If the answer is not available in the
context, clearly say that you don't have
enough information.

Context:

${contextText}

User Question:

${question}
`;

    const response =
      await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

    return response.text;
  } catch (error) {
    console.error(
      "Answer Generation Error:",
      error.message
    );

    return `
Gemini quota is temporarily unavailable.

Retrieved context:

${contextText}
`;
  }
}