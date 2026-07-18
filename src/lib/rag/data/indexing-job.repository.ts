import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isIndexableSourceType } from "../source-config";
import type { IndexingJob } from "../types";

export function parseIndexingJob(value: { sourceType: string; sourceId: string; operation: string }): IndexingJob {
  if (!isIndexableSourceType(value.sourceType) || !value.sourceId || (value.operation !== "upsert" && value.operation !== "delete")) throw new Error("Invalid search indexing job payload");
  return value as IndexingJob;
}

export async function claimIndexingJobs(limit: number) {
  const rows = await prisma.$queryRaw<Array<{ id: string; sourceType: string; sourceId: string; operation: string }>>(Prisma.sql`
    WITH claimed AS (
      SELECT id FROM "search_index_jobs" WHERE "available_at" <= NOW() AND "locked_at" IS NULL
      ORDER BY "created_at" FOR UPDATE SKIP LOCKED LIMIT ${limit}
    ) UPDATE "search_index_jobs" AS jobs SET "locked_at" = NOW(), "updated_at" = NOW()
    FROM claimed WHERE jobs.id = claimed.id RETURNING jobs.id, jobs."sourceType", jobs."sourceId", jobs.operation
  `);
  return rows.map((row) => ({ id: row.id, job: parseIndexingJob(row) }));
}

export function acknowledgeIndexingJob(id: string) { return prisma.searchIndexJob.delete({ where: { id } }); }

export function retryIndexingJob(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return prisma.$executeRaw(Prisma.sql`UPDATE "search_index_jobs" SET attempts = attempts + 1, "last_error" = ${message.slice(0, 2000)}, "locked_at" = NULL, "available_at" = NOW() + INTERVAL '1 minute', "updated_at" = NOW() WHERE id = ${id}::uuid`);
}
