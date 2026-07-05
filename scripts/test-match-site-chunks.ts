import { config as loadEnv } from "dotenv";
import { retrieveContext } from "../src/lib/rag/retrieve-context";

loadEnv({ path: ".env.local" });

async function main() {
  const queries = [
    "What projects has he worked on?",
    "Has he built any automation stuff before?",
    "How good is he?",
    "How many years of experience does he have?",
    "What AI projects has Freeman built?",
  ];

  for (const query of queries) {
    const result = await retrieveContext(query);

    console.log(`Query: ${query}`);
    console.log(
      JSON.stringify(
        {
          sourceTitles: result.sources.map((source) => source.title),
          similarityScores: result.chunks.map((chunk) => ({
            title: chunk.title,
            similarity: chunk.similarity,
          })),
        },
        null,
        2,
      ),
    );
    console.log("---");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
