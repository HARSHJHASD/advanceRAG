import { defaultDocuments } from "../data/defaultDocuments.js";
import { chunkDocument } from "./chunkingService.js";
import { generateEmbedding } from "./embeddingService.js";

import {
  getDocumentById,
  storeDocument,
} from "./vectorStoreService.js";

export async function initializeRAGDocuments() {
  try {
    console.log("Starting document ingestion...");

    for (const document of defaultDocuments) {
      console.log(`Processing: ${document.title}`);

      // Split the large document into chunks
      const chunks = chunkDocument(
        document.content,
        500,
        100
      );

      console.log(`Created ${chunks.length} chunks`);

      for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index];

        const chunkId =
          `${document.id}_chunk_${index + 1}`;

        // Check whether this chunk already exists
        const existingDocument =
          await getDocumentById(chunkId);

        if (existingDocument.ids.length > 0) {
          console.log(
            `Skipping ${chunkId} - already exists`
          );

          continue;
        }

        console.log(
          `Generating embedding for ${chunkId}`
        );

        // Generate embedding
        const embedding =
          await generateEmbedding(chunk);

        // Store chunk in ChromaDB
        await storeDocument({
          id: chunkId,
          document: chunk,
          embedding,
          metadata: {
            sourceId: document.id,
            title: document.title,
            topic: document.topic,
            chunkIndex: index + 1,
            totalChunks: chunks.length,
          },
        });

        console.log(
          `${chunkId} stored successfully`
        );
      }
    }

    console.log("Document ingestion completed!");
  } catch (error) {
    console.error(
      "Document Ingestion Error:",
      error
    );
  }
}