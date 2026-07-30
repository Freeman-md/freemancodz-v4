import { indexSourceRecord } from "@/server/modules/search-index/services/index-source-record.service";
import { parseIndexSourceInput } from "@/server/modules/search-index/schemas/index-source-input.schema";

async function main() {
  const input = parseIndexSourceInput(process.argv[2], process.argv[3]);
  const result = await indexSourceRecord(input);

  console.log(`Indexed ${input.sourceType}:${input.sourceId}`);
  console.table(result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
