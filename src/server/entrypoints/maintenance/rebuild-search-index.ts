import { requireProductionConfirmation } from "./require-production-confirmation";

const isProductionRun = process.argv.includes("--production");

async function main() {
  if (isProductionRun) {
    requireProductionConfirmation();
  }

  const [
    { findAllIndexableSources },
    { indexSourceRecord },
  ] = await Promise.all([
    import("@/server/modules/search-index/repositories/indexing-source.repository"),
    import("@/server/modules/search-index/services/index-source-record.service"),
  ]);
  const sources = await findAllIndexableSources();

  const totals = {
    created: 0,
    changed: 0,
    unchanged: 0,
    deleted: 0,
  };

  for (const source of sources) {
    const result = await indexSourceRecord({
      sourceType: source.sourceType,
      sourceId: source.record.id,
    });

    totals.created += result.created;
    totals.changed += result.changed;
    totals.unchanged += result.unchanged;
    totals.deleted += result.deleted;

    console.log(
      `${source.sourceType}:${source.record.id}`,
      result,
    );
  }

  console.log("\nRebuild complete");
  console.table(totals);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
