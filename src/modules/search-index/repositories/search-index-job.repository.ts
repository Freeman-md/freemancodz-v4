import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type { SearchIndexJobStore } from "../types";
import type {
  ClaimedSearchIndexJob,
  SearchIndexJob,
  SearchIndexJobClaimResult,
} from "../types";

const MAX_ATTEMPTS = 3;

const MAX_ERROR_SUMMARY_LENGTH = 500;

const STALE_PROCESSING_TIMEOUT_MINUTES = 10;

const STALE_JOB_ERROR_SUMMARY = "Search index processing stopped before settlement.";

const GENERIC_ERROR_SUMMARY = "Search index rebuild failed.";

type SearchIndexJobRow = SearchIndexJob;

function normalizeSafeErrorSummary(summary: string): string {
  return (summary.trim() || GENERIC_ERROR_SUMMARY).slice(0, MAX_ERROR_SUMMARY_LENGTH);
}

function asClaimedJob(job: SearchIndexJobRow | undefined): ClaimedSearchIndexJob | null {
  if (!job) {
    return null;
  }

  if (job.status !== "processing" || !job.claimedAt) {
    throw new Error("Claimed search index work returned an invalid processing state.");
  }

  return job as ClaimedSearchIndexJob;
}

export class SearchIndexJobRepository implements SearchIndexJobStore {
  constructor(private readonly database: PrismaClient) {}

  async requestRebuild(): Promise<void> {
    await this.database.$executeRaw`
      INSERT INTO public.search_index_jobs (
        job_key,
        status,
        rerun_requested,
        attempts,
        available_at,
        requested_at,
        claimed_at,
        processed_at,
        last_error
      )
      VALUES (
        'portfolio',
        'pending',
        false,
        0,
        statement_timestamp(),
        statement_timestamp(),
        NULL,
        NULL,
        NULL
      )
      ON CONFLICT (job_key) DO UPDATE SET
        status = CASE
          WHEN public.search_index_jobs.status = 'processing' THEN 'processing'
          ELSE 'pending'
        END,
        rerun_requested = public.search_index_jobs.status = 'processing',
        attempts = CASE
          WHEN public.search_index_jobs.status IN ('pending', 'processing')
            THEN public.search_index_jobs.attempts
          ELSE 0
        END,
        available_at = CASE
          WHEN public.search_index_jobs.status = 'processing'
            THEN public.search_index_jobs.available_at
          ELSE statement_timestamp()
        END,
        requested_at = statement_timestamp(),
        claimed_at = CASE
          WHEN public.search_index_jobs.status = 'processing'
            THEN public.search_index_jobs.claimed_at
          ELSE NULL
        END,
        processed_at = NULL,
        last_error = CASE
          WHEN public.search_index_jobs.status IN ('pending', 'processing')
            THEN public.search_index_jobs.last_error
          ELSE NULL
        END
    `;
  }

  async claim(): Promise<SearchIndexJobClaimResult> {
    return this.database.$transaction(async (transaction) => {
      const [recovery] = await transaction.$queryRaw<Array<{ recovered: boolean }>>`
        WITH recovered_job AS (
          UPDATE public.search_index_jobs
          SET
            status = CASE
              WHEN rerun_requested OR attempts < ${MAX_ATTEMPTS} THEN 'pending'
              ELSE 'failed'
            END,
            rerun_requested = false,
            attempts = CASE WHEN rerun_requested THEN 0 ELSE attempts END,
            available_at = CASE
              WHEN rerun_requested OR attempts < ${MAX_ATTEMPTS}
                THEN statement_timestamp()
              ELSE available_at
            END,
            claimed_at = NULL,
            processed_at = CASE
              WHEN rerun_requested OR attempts < ${MAX_ATTEMPTS}
                THEN NULL
              ELSE statement_timestamp()
            END,
            last_error = CASE
              WHEN rerun_requested THEN NULL
              ELSE ${STALE_JOB_ERROR_SUMMARY}
            END
          WHERE job_key = 'portfolio'
            AND status = 'processing'
            AND claimed_at < statement_timestamp()
              - (${STALE_PROCESSING_TIMEOUT_MINUTES} * INTERVAL '1 minute')
          RETURNING job_key
        )
        SELECT EXISTS (SELECT 1 FROM recovered_job) AS recovered
      `;

      const [job] = await transaction.$queryRaw<SearchIndexJobRow[]>`
        UPDATE public.search_index_jobs
        SET
          status = 'processing',
          rerun_requested = false,
          attempts = attempts + 1,
          claimed_at = date_trunc(
            'milliseconds',
            GREATEST(statement_timestamp(), available_at)
          ) + INTERVAL '1 millisecond',
          processed_at = NULL
        WHERE job_key = 'portfolio'
          AND status = 'pending'
          AND available_at <= statement_timestamp()
          AND attempts < ${MAX_ATTEMPTS}
        RETURNING
          job_key AS "jobKey",
          status,
          rerun_requested AS "rerunRequested",
          attempts,
          available_at AS "availableAt",
          requested_at AS "requestedAt",
          claimed_at AS "claimedAt",
          processed_at AS "processedAt",
          last_error AS "lastError"
      `;

      return {
        job: asClaimedJob(job),
        staleJobRecovered: recovery?.recovered ?? false,
      };
    });
  }

  async complete(claimedAt: Date): Promise<SearchIndexJob | null> {
    const [job] = await this.database.$queryRaw<SearchIndexJobRow[]>`
      UPDATE public.search_index_jobs
      SET
        status = CASE WHEN rerun_requested THEN 'pending' ELSE 'completed' END,
        rerun_requested = false,
        attempts = CASE WHEN rerun_requested THEN 0 ELSE attempts END,
        available_at = CASE
          WHEN rerun_requested THEN statement_timestamp()
          ELSE available_at
        END,
        claimed_at = NULL,
        processed_at = CASE
          WHEN rerun_requested THEN NULL
          ELSE statement_timestamp()
        END,
        last_error = NULL
      WHERE job_key = 'portfolio'
        AND status = 'processing'
        AND claimed_at = ${claimedAt}
      RETURNING
        job_key AS "jobKey",
        status,
        rerun_requested AS "rerunRequested",
        attempts,
        available_at AS "availableAt",
        requested_at AS "requestedAt",
        claimed_at AS "claimedAt",
        processed_at AS "processedAt",
        last_error AS "lastError"
    `;

    return job ?? null;
  }

  async fail(claimedAt: Date, safeErrorSummary: string): Promise<SearchIndexJob | null> {
    const lastError = normalizeSafeErrorSummary(safeErrorSummary);

    const [job] = await this.database.$queryRaw<SearchIndexJobRow[]>`
      UPDATE public.search_index_jobs
      SET
        status = CASE
          WHEN rerun_requested OR attempts < ${MAX_ATTEMPTS} THEN 'pending'
          ELSE 'failed'
        END,
        rerun_requested = false,
        attempts = CASE WHEN rerun_requested THEN 0 ELSE attempts END,
        available_at = CASE
          WHEN rerun_requested OR attempts < ${MAX_ATTEMPTS}
            THEN statement_timestamp()
          ELSE available_at
        END,
        claimed_at = NULL,
        processed_at = CASE
          WHEN rerun_requested OR attempts < ${MAX_ATTEMPTS}
            THEN NULL
          ELSE statement_timestamp()
        END,
        last_error = CASE
          WHEN rerun_requested THEN NULL
          ELSE ${lastError}
        END
      WHERE job_key = 'portfolio'
        AND status = 'processing'
        AND claimed_at = ${claimedAt}
      RETURNING
        job_key AS "jobKey",
        status,
        rerun_requested AS "rerunRequested",
        attempts,
        available_at AS "availableAt",
        requested_at AS "requestedAt",
        claimed_at AS "claimedAt",
        processed_at AS "processedAt",
        last_error AS "lastError"
    `;

    return job ?? null;
  }
}
