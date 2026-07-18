import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { parseIndexingJob } from "../indexing-job-validation";
export { parseIndexingJob } from "../indexing-job-validation";

export async function claimIndexingJobs(limit: number) {
  const rows = await prisma.$queryRaw<Array<{ id: string; sourceType: string; sourceId: string; operation: string; lockedAt: Date }>>(Prisma.sql`
    WITH claimed AS (
      SELECT id FROM "search_index_jobs" WHERE "available_at" <= NOW() AND ("locked_at" IS NULL OR "locked_at" < NOW() - INTERVAL '5 minutes')
      ORDER BY "created_at" FOR UPDATE SKIP LOCKED LIMIT ${limit}
    ) UPDATE "search_index_jobs" AS jobs SET "locked_at" = NOW(), "updated_at" = NOW()
    FROM claimed WHERE jobs.id = claimed.id RETURNING jobs.id, jobs."sourceType", jobs."sourceId", jobs.operation, jobs."locked_at" AS "lockedAt"
  `);
  return rows.map((row) => ({ id: row.id, lockToken: row.lockedAt, job: parseIndexingJob(row) }));
}

export function acknowledgeIndexingJob(id: string, lockToken: Date) {
  return prisma.searchIndexJob.deleteMany({ where: { id, lockedAt: lockToken } });
}

export function retryIndexingJob(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return prisma.$executeRaw(Prisma.sql`UPDATE "search_index_jobs" SET attempts = attempts + 1, "last_error" = ${message.slice(0, 2000)}, "locked_at" = NULL, "available_at" = NOW() + INTERVAL '1 minute', "updated_at" = NOW() WHERE id = ${id}::uuid`);
}
