import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type { ISearchIndexJobRepository } from "../interfaces/search-index-job.repository.interface";
import type {
  SearchIndexJob,
  SearchIndexJobStatusSummary,
} from "../interfaces/search-index-job.repository.interface";

const DEFAULT_MAX_ATTEMPTS = 5;

const STALE_PROCESSING_TIMEOUT_MINUTES = 10;

const MAX_ERROR_LENGTH = 4_000;

type SearchIndexJobRow = SearchIndexJob;

function truncateError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  return message.slice(0, MAX_ERROR_LENGTH);
}

export class SearchIndexJobRepository implements ISearchIndexJobRepository {
  constructor(private readonly database: PrismaClient) {}

  async claim(limit: number): Promise<SearchIndexJob[]> {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("Search index job claim limit must be a positive integer.");
    }

    return this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`
      UPDATE search_index_jobs
      SET
        status = 'pending',
        available_at = NOW(),
        claimed_at = NULL,
        last_error = 'Recovered stale processing job'
      WHERE status = 'processing'
        AND claimed_at < NOW() - (${STALE_PROCESSING_TIMEOUT_MINUTES} * INTERVAL '1 minute');
    `;

      return transaction.$queryRaw<SearchIndexJobRow[]>`
      WITH jobs_to_claim AS (
        SELECT id
        FROM search_index_jobs
        WHERE status = 'pending'
          AND available_at <= NOW()
        ORDER BY available_at ASC, created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${limit}
      )
      UPDATE search_index_jobs AS jobs
      SET
        status = 'processing',
        attempts = jobs.attempts + 1,
        claimed_at = NOW(),
        processed_at = NULL
      FROM jobs_to_claim
      WHERE jobs.id = jobs_to_claim.id
      RETURNING
        jobs.id,
        jobs.operation,
        jobs.source_type AS "sourceType",
        jobs.source_id AS "sourceId",
        jobs.status,
        jobs.attempts,
        jobs.available_at AS "availableAt",
        jobs.claimed_at AS "claimedAt",
        jobs.last_error AS "lastError",
        jobs.created_at AS "createdAt",
        jobs.processed_at AS "processedAt";
    `;
    });
  }

  async complete(id: string): Promise<SearchIndexJob | null> {
    const [job] = await this.database.$queryRaw<SearchIndexJobRow[]>`
    UPDATE search_index_jobs
    SET
      status = 'completed',
      processed_at = NOW(),
      claimed_at = NULL,
      last_error = NULL
    WHERE id = ${id}::uuid
      AND status = 'processing'
    RETURNING
      id,
      operation,
      source_type AS "sourceType",
      source_id AS "sourceId",
      status,
      attempts,
      available_at AS "availableAt",
      claimed_at AS "claimedAt",
      last_error AS "lastError",
      created_at AS "createdAt",
      processed_at AS "processedAt";
  `;

    return job ?? null;
  }

  async fail(
    id: string,
    error: unknown,
    options: { maxAttempts?: number } = {},
  ): Promise<SearchIndexJob | null> {
    const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      throw new Error("Search index job maximum attempts must be a positive integer.");
    }

    const lastError = truncateError(error);

    const [job] = await this.database.$queryRaw<SearchIndexJobRow[]>`
    UPDATE search_index_jobs
    SET
      status = CASE WHEN attempts < ${maxAttempts} THEN 'pending' ELSE 'failed' END,
      available_at = CASE
        WHEN attempts < ${maxAttempts}
          THEN NOW() + (5 * POWER(2, attempts - 1))::double precision * INTERVAL '1 second'
        ELSE available_at
      END,
      claimed_at = NULL,
      last_error = ${lastError},
      processed_at = CASE WHEN attempts < ${maxAttempts} THEN NULL ELSE NOW() END
    WHERE id = ${id}::uuid
      AND status = 'processing'
    RETURNING
      id,
      operation,
      source_type AS "sourceType",
      source_id AS "sourceId",
      status,
      attempts,
      available_at AS "availableAt",
      claimed_at AS "claimedAt",
      last_error AS "lastError",
      created_at AS "createdAt",
      processed_at AS "processedAt";
  `;

    return job ?? null;
  }

  async getStatus(): Promise<SearchIndexJobStatusSummary> {
    const [pending, processing, completed, failed, oldestPending, staleProcessing, recentFailed] =
      await Promise.all([
        this.database.searchIndexJob.count({ where: { status: "pending" } }),
        this.database.searchIndexJob.count({ where: { status: "processing" } }),
        this.database.searchIndexJob.count({ where: { status: "completed" } }),
        this.database.searchIndexJob.count({ where: { status: "failed" } }),
        this.database.searchIndexJob.findFirst({
          where: { status: "pending" },
          orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
        }),
        this.database.searchIndexJob.count({
          where: {
            status: "processing",
            claimedAt: {
              lt: new Date(Date.now() - STALE_PROCESSING_TIMEOUT_MINUTES * 60_000),
            },
          },
        }),
        this.database.searchIndexJob.findMany({
          where: { status: "failed" },
          orderBy: { processedAt: "desc" },
          take: 5,
        }),
      ]);

    return {
      pending,
      processing,
      completed,
      failed,
      oldestPending: oldestPending as SearchIndexJob | null,
      staleProcessing,
      recentFailed: recentFailed as SearchIndexJob[],
    };
  }

  async clear(): Promise<void> {
    await this.database.searchIndexJob.deleteMany();
  }
}
