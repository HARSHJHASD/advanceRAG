import { sunDocuments } from "../data/defaultDocuments.js";

import { generateEmbedding } from "./embeddingService.js";

import {
  documentExists,
  addDocument,
} from "./vectorStoreService.js";

export async function initializeRAGDocuments() {
  try {
    console.log("Initializing RAG documents...");

    for (const document of sunDocuments) {
      // Check if document already exists
      const exists = await documentExists(document.id);

      if (exists) {
        console.log(
          `Skipping ${document.id} - already exists`
        );

        continue;
      }

      console.log(
        `Generating embedding for ${document.id}...`
      );

      // Generate embedding
      const embedding = await generateEmbedding(
        document.content
      );

      // Store document
      await addDocument({
        id: document.id,
        content: document.content,
        embedding,
        metadata: document.metadata,
      });

      console.log(
        `${document.id} stored successfully`
      );
    }

    console.log(
      "RAG document initialization completed"
    );
  } catch (error) {
    console.error(
      "RAG Initialization Error:",
      error
    );
  }
}