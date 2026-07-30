import { indexSourceRecord } from "@/server/modules/search-index/services/index-source-record.service";
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