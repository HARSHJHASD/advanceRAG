import { defaultDocuments } from "../data/defaultDocuments.js";
import { chunkDocument } from "./chunkingService.js";
import { generateEmbedding } from "./embeddingService.js";

import {
  storeDocument,
} from "./vectorStoreService.js";

export async function initializeRAGDocuments() {
  try {
    console.log("Starting document ingestion...");

    for (const document of defaultDocuments) {
      console.log(`Processing: ${document.title}`);

      // =========================
      // Chunk the document
      // =========================

      const chunks = chunkDocument(
        document.content,
        500,
        100
      );

      console.log(
        `Created ${chunks.length} chunks`
      );

      // =========================
      // Process every chunk
      // =========================

      for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index];

        const chunkId = `${document.id}_chunk_${index + 1}`;

        console.log(
          `Generating embedding for ${chunkId}...`
        );

        // =========================
        // Generate embedding
        // =========================

        const embedding =
          await generateEmbedding(chunk);

        // =========================
        // Store / Update ChromaDB
        // =========================

        await storeDocument({
          id: chunkId,

          document: chunk,

          embedding,

          metadata: {
            sourceId: document.id,

            title: document.title,

            topic: document.topic,

            documentType: document.documentType,

            chunkIndex: index + 1,

            totalChunks: chunks.length,
          },
        });

        console.log(
          `${chunkId} stored/updated successfully`
        );
      }
    }

    console.log(
      "Document ingestion completed successfully!"
    );
  } catch (error) {
    console.error(
      "Document Ingestion Error:",
      error
    );
  }
}