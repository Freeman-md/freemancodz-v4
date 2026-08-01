import { SearchIndexSourceInputSchema } from "@/contracts/search-index-source.contract";
import { searchIndexService } from "@/server/composition-root";

async function main() {
  const input = SearchIndexSourceInputSchema.parse({
    sourceType: process.argv[2],
    sourceId: process.argv[3],
  });

  const result = await searchIndexService.indexSource(input);

  console.log(`Indexed ${input.sourceType}:${input.sourceId}`);
  console.table(result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
