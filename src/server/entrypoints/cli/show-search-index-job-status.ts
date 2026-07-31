import { searchIndexService } from "@/server/composition-root";
import { prisma } from "@/server/infrastructure/database/prisma";

async function main() {
  const status = await searchIndexService.getJobStatus();

  console.table({
    pending: status.pending,
    processing: status.processing,
    completed: status.completed,
    failed: status.failed,
    staleProcessing: status.staleProcessing,
    oldestPending: status.oldestPending
      ? `${status.oldestPending.operation} ${status.oldestPending.sourceType}:${status.oldestPending.sourceId} (${status.oldestPending.availableAt.toISOString()})`
      : "None",
  });

  console.log("Recent failed jobs");
  console.table(status.recentFailed.map((job) => ({
    operation: job.operation,
    sourceType: job.sourceType,
    sourceId: job.sourceId,
    attempts: job.attempts,
    lastError: job.lastError,
    processedAt: job.processedAt?.toISOString() ?? null,
  })));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
