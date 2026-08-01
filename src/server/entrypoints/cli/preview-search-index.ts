import { SearchIndexSourceInputSchema } from "@/contracts/search-index-source.contract";
import { searchIndexService } from "@/server/composition-root";

async function main() {
  const input = SearchIndexSourceInputSchema.parse({
    sourceType: process.argv[2],
    sourceId: process.argv[3],
  });

  const preview = await searchIndexService.preview(input);

  console.log("\nSource");
  console.log({
    sourceType: input.sourceType,
    sourceId: input.sourceId,
  });

  console.log("\nMapped document");
  console.dir(preview.document, { depth: null });

  for (const chunk of preview.chunks) {
    console.log("\nPrepared chunk");
    console.dir(
      {
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        chunkIndex: chunk.chunkIndex,
        title: chunk.title,
        category: chunk.category,
        url: chunk.url,
        content: chunk.content,
        keywords: chunk.keywords,
      },
      { depth: null },
    );

    console.log({
      id: chunk.id,
      embeddingInput: chunk.embeddingInput,
      contentHash: chunk.contentHash,
    });
  }

  console.log("\nExpected source action:", preview.expectedAction);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
