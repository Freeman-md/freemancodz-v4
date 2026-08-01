import { requireProductionConfirmation } from "./require-production-confirmation";

const isProductionRun = process.argv.includes("--production");

const clean = process.argv.includes("--clean");

async function main() {
  if (isProductionRun) {
    requireProductionConfirmation();
  }

  const { searchIndexService } = await import("@/server/composition-root");

  console.log(
    `Rebuilding the ${isProductionRun ? "production" : "local"} search index${clean ? " from a clean state" : ""}.`,
  );
  const { results, summary } = await searchIndexService.rebuild({ clean });

  for (const item of results) {
    console.log(`${item.sourceType}:${item.sourceId}`, item.result);
  }

  console.log("\nRebuild complete");
  console.table(summary);
}

main().catch((error) => {
  if (
    error &&
    typeof error === "object" &&
    "summary" in error &&
    error.summary &&
    typeof error.summary === "object"
  ) {
    console.table(error.summary);
  }

  console.error(error);
  process.exitCode = 1;
});
