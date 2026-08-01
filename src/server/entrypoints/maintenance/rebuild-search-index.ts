import { requireProductionConfirmation } from "./require-production-confirmation";

const isProductionRun = process.argv.includes("--production");

async function main() {
  if (isProductionRun) {
    requireProductionConfirmation();
  }

  const { searchIndexService } = await import("@/server/composition-root");

  const { results, totals } = await searchIndexService.rebuild();

  for (const item of results) {
    console.log(`${item.sourceType}:${item.sourceId}`, item.result);
  }

  console.log("\nRebuild complete");
  console.table(totals);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
