export const defaultDocuments = [
  {
    id: "sun_document",
    title: "Understanding the Sun",
    topic: "astronomy",
    documentType: "educational",

    content: `
The Sun is the star at the center of our solar system.

The Sun provides light and heat that make life on Earth possible.

The Sun is primarily composed of hydrogen and helium.

The Sun's gravity keeps the planets of our solar system in orbit.

Nuclear fusion inside the Sun's core produces enormous amounts of energy.
    `,
  },

  {
    id: "javascript_document",
    title: "JavaScript Fundamentals",
    topic: "programming",
    documentType: "educational",

    content: `
JavaScript is a programming language used to build interactive web applications.

JavaScript runs in browsers and can also run on servers using Node.js.

JavaScript supports asynchronous programming using promises and async await.

Modern JavaScript frameworks include React, Angular, and Vue.
    `,
  },

  {
    id: "rag_document",
    title: "Introduction to RAG",
    topic: "artificial-intelligence",
    documentType: "technical",

    content: `
Retrieval Augmented Generation, also known as RAG, combines information retrieval with large language models.

A RAG system retrieves relevant documents from a vector database before generating an answer.

Embeddings convert text into numerical vectors that allow semantic similarity search.

Vector databases such as ChromaDB store embeddings and help retrieve similar information.
    `,
  },
];