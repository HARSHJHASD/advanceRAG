import ai from "../config/gemini.js";

export async function generateAnswer(question, context) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `Answer the question using only the provided context. If the context does not contain the answer, say so clearly.\n\nContext:\n${context}\n\nQuestion:\n${question}`,
        });

        return response.text;
    } catch (error) {
        if (error.status === 429) {
            return `Gemini quota is temporarily unavailable. Retrieved context:\n\n${context}`;
        }

        throw error;
    }
}
