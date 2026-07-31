import { parseIndexSourceInput } from "@/server/modules/search-index/public";
import { searchIndexService } from "@/server/composition-root";

async function main() {
  const input = parseIndexSourceInput(process.argv[2], process.argv[3]);
  const result = await searchIndexService.indexSource(input);

  console.log(`Indexed ${input.sourceType}:${input.sourceId}`);
  console.table(result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
