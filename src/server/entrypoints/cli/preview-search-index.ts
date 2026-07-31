import { SearchIndexSourceInputSchema } from "@/contracts/search-index-source.contract";
import { searchIndexService } from "@/server/composition-root";

async function main() {
  const input = SearchIndexSourceInputSchema.parse({ sourceType: process.argv[2], sourceId: process.argv[3] });

  const preview = await searchIndexService.preview(input);

  console.log("\nSource");
  console.log({
    sourceType: input.sourceType,
    sourceId: input.sourceId,
  });

  if (preview.chunks.length === 0) {
    console.log("\nGenerated documents: none");
  }

  for (const chunk of preview.chunks) {

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
      expectedAction: chunk.expectedAction,
    });
  }

  for (const id of preview.obsoleteIds) {
    console.log("\nObsolete chunk");
    console.log({
      id,
      expectedAction: "delete",
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
