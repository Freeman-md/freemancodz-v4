import { indexSourceRecord } from "@/features/search-indexing/index-source-record";
import { parseSourceArguments } from "./lib/indexing-arguments";

async function main() {
  const input = parseSourceArguments();
  const result = await indexSourceRecord(input);

  console.log(`Indexed ${input.sourceType}:${input.sourceId}`);
  console.table(result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});