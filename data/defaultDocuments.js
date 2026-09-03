export const defaultDocuments = [
  {
    id: "sun_document",

    title: "Understanding the Sun",

    topic: "astronomy",

    documentType: "educational",

    content: `
The Sun is the star at the center of our solar system. It is a nearly perfect sphere of hot plasma and is the most important source of energy for life on Earth.

The Sun provides light and heat that make life on Earth possible. Energy from the Sun supports many natural processes, including photosynthesis and the Earth's climate system.

The Sun is primarily composed of hydrogen and helium. Hydrogen is the most abundant element in the Sun, while helium is the second most abundant element.

The Sun's gravity keeps the planets, asteroids, comets, and other objects in our solar system in orbit.

Nuclear fusion takes place inside the Sun's core. During this process, hydrogen atoms combine to form helium and release enormous amounts of energy.

The Sun is approximately 4.6 billion years old and scientists estimate that it will continue producing energy for several billion more years.

The temperature at the Sun's core is significantly higher than the temperature at its surface. The core is where most of the nuclear fusion occurs.
    `,
  },

  {
    id: "javascript_document",

    title: "JavaScript Fundamentals",

    topic: "programming",

    documentType: "educational",

    content: `
JavaScript is a programming language used to build interactive and dynamic web applications.

JavaScript primarily runs inside web browsers, but it can also run on servers using environments such as Node.js.

JavaScript supports asynchronous programming through callbacks, promises, and async await.

Modern JavaScript applications often use frameworks and libraries such as React, Angular, and Vue.

JavaScript supports different programming styles, including procedural programming, object-oriented programming, and functional programming.

Developers use JavaScript to manipulate web page elements, handle user interactions, communicate with APIs, and build complete full-stack applications.

Node.js allows developers to use JavaScript on the server side, making JavaScript useful for both frontend and backend development.
    `,
  },

  {
    id: "rag_document",

    title: "Introduction to RAG",

    topic: "artificial-intelligence",

    documentType: "technical",

    content: `
Retrieval Augmented Generation, also known as RAG, combines information retrieval with large language models.

A RAG system retrieves relevant information from a knowledge base before generating an answer.

Documents are usually divided into smaller chunks before they are stored in a vector database.

Each document chunk is converted into a numerical representation called an embedding.

Embeddings allow a system to perform semantic similarity search, meaning that documents can be retrieved based on their meaning rather than only matching exact keywords.

Vector databases such as ChromaDB store embeddings and help retrieve information that is semantically similar to a user's question.

After retrieving relevant documents, the RAG system provides those documents as context to a large language model.

The large language model then uses the retrieved context to generate a more accurate and grounded answer.

Advanced RAG systems can include techniques such as similarity thresholds, metadata filtering, query rewriting, multi-query retrieval, reranking, and context compression.
    `,
  },
];