import { config as loadEnv } from "dotenv";
import { retrieveContext } from "../src/lib/rag/retrieve-context";

loadEnv({ path: ".env.local" });

async function main() {
  const query = "What AI projects has Freeman built?";
  const result = await retrieveContext(query);

  console.log(`Query: ${query}`);
  console.log(
    JSON.stringify(
      {
        sourceTitles: result.sources.map((source) => source.title),
        rows: result.chunks,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
