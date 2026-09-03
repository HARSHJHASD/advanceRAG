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

      const chunks = chunkDocument(
        document.content,
        500,
        100
      );

      for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index];

        const chunkId = `${document.id}_chunk_${index + 1}`;

        const existingDocument =
          await getDocumentById(chunkId);

        if (existingDocument.ids.length > 0) {
          console.log(
            `Skipping ${chunkId} - already exists`
          );

          continue;
        }

        const embedding =
          await generateEmbedding(chunk);

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

        console.log(`${chunkId} stored`);
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