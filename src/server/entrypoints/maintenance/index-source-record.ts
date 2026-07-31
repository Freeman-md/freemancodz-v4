import { z } from "zod";
import { searchIndexService } from "@/server/composition-root";

async function main() {
  const input = z.object({ sourceType: z.enum(["content_blocks", "projects", "services", "principles", "experiences"]), sourceId: z.string().trim().min(1, "Source ID is required.") }).parse({ sourceType: process.argv[2], sourceId: process.argv[3] });
  const result = await searchIndexService.indexSource(input);

  console.log(`Indexed ${input.sourceType}:${input.sourceId}`);
  console.table(result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
