import { defaultDocuments } from "../data/defaultDocuments.js";
import { chunkDocument } from "./chunkingService.js";
import { generateEmbedding } from "./embeddingService.js";

import {
  deleteDocumentsById,
  getDocumentById,
  getDocumentIdsBySourceId,
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

      const expectedChunkIds = new Set(
        chunks.map((_, index) => `${document.id}_chunk_${index + 1}`)
      );

      // =========================
      // Process every chunk
      // =========================

      for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index];

        const chunkId = `${document.id}_chunk_${index + 1}`;

        // Avoid spending Gemini embedding quota on chunks that are already
        // present and unchanged from a previous startup.
        const existing = await getDocumentById(chunkId);
        const existingDocument = existing.documents?.[0];

        if (existingDocument === chunk) {
          console.log(`${chunkId} is already up to date; skipping embedding.`);
          continue;
        }

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

      // Semantic chunking can reduce the number of chunks. Remove only the
      // explicit stale IDs for this source so obsolete content is never
      // retrieved after a document update.
      const storedChunkIds = await getDocumentIdsBySourceId(document.id);
      const staleChunkIds = storedChunkIds.filter(
        (id) => !expectedChunkIds.has(id)
      );

      await deleteDocumentsById(staleChunkIds);

      if (staleChunkIds.length) {
        console.log(`Removed ${staleChunkIds.length} stale chunks for ${document.id}.`);
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
