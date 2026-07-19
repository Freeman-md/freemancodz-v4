import { buildSearchDocuments } from "@/features/search-indexing/build-search-documents";
import { findIndexedChunksBySource } from "@/features/search-indexing/data/site-chunk.repository";
import { findIndexableSource } from "@/features/search-indexing/data/indexing-source.repository";
import { prepareSiteChunk } from "@/features/search-indexing/prepare-site-chunk";
import { parseSourceArguments } from "./lib/indexing-arguments";
import { getEmbeddingModel } from "@/lib/openai";

async function main() {
  const input = parseSourceArguments();

  const source = await findIndexableSource(
    input.sourceType,
    input.sourceId,
  );

  if (!source) {
    throw new Error(
      `Source not found: ${input.sourceType}:${input.sourceId}`,
    );
  }

  const preparedChunks = buildSearchDocuments(source).map(prepareSiteChunk);

  const existingChunks = await findIndexedChunksBySource(
    input.sourceType,
    input.sourceId,
  );

  const existingById = new Map(
    existingChunks.map((chunk) => [chunk.id, chunk]),
  );

  const currentModel = getEmbeddingModel();
  const generatedIds = new Set(preparedChunks.map((chunk) => chunk.id));

  console.log("\nSource");
  console.log({
    sourceType: input.sourceType,
    sourceId: input.sourceId,
  });

  if (preparedChunks.length === 0) {
    console.log("\nGenerated documents: none");
  }

  for (const chunk of preparedChunks) {
    const existing = existingById.get(chunk.id);

    const expectedAction = !existing
      ? "create"
      : existing.contentHash !== chunk.contentHash ||
          existing.embeddingModel !== currentModel
        ? "update"
        : "unchanged";

    console.log("\nGenerated document");
    console.dir(
      {
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        documentIndex: chunk.documentIndex,
        title: chunk.title,
        category: chunk.category,
        url: chunk.url,
        content: chunk.content,
        keywords: chunk.keywords,
      },
      { depth: null },
    );

    console.log("\nPrepared chunk");
    console.log({
      id: chunk.id,
      chunkIndex: chunk.chunkIndex,
      embeddingInput: chunk.embeddingInput,
      contentHash: chunk.contentHash,
      expectedAction,
    });
  }

  const obsoleteChunks = existingChunks.filter(
    (chunk) => !generatedIds.has(chunk.id),
  );

  for (const chunk of obsoleteChunks) {
    console.log("\nObsolete chunk");
    console.log({
      id: chunk.id,
      expectedAction: "delete",
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});