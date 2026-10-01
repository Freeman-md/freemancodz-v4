import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type {
  ConsumeStoredRateLimitInput,
  RateLimitRule,
  RateLimitResult,
  RateLimitStore,
} from "./rate-limit.types";
import { validateStoredRateLimitInput } from "./validation";

type StoredRateLimit = {
  ruleId: string;
  count: number;
  resetAt: Date;
};

type RateLimitRecord = {
  rule: RateLimitRule;
  record: StoredRateLimit;
};

function sortRules(rules: readonly RateLimitRule[]) {
  // Always lock rules in the same order so two requests do not wait on each other.
  return [...rules].sort((left, right) => left.id.localeCompare(right.id));
}

function toInsertValues(
  scope: string,
  keyHash: string,
  rule: RateLimitRule,
  resetAt: Date,
  updatedAt: Date,
) {
  return Prisma.sql`(${scope}, ${keyHash}, ${rule.id}, 0, ${resetAt}, ${updatedAt})`;
}

export class RateLimitRepository implements RateLimitStore {
  constructor(private readonly database: PrismaClient) {}

  async consume(input: ConsumeStoredRateLimitInput): Promise<RateLimitResult> {
    validateStoredRateLimitInput(input);

    const rules = sortRules(input.rules);

    return this.database.$transaction(async (transaction) => {
      const records = await this.createAndLockRecords(transaction, input, rules);

      await this.resetExpiredRecords(transaction, input, records);

      const exhaustedRecord = this.findExhaustedRecord(records);

      if (exhaustedRecord) {
        return {
          allowed: false,
          limit: exhaustedRecord.rule.limit,
          remaining: 0,
          resetAt: exhaustedRecord.record.resetAt.getTime(),
        };
      }

      await this.incrementRecords(transaction, input, records);

      return { allowed: true };
    });
  }

  private async createAndLockRecords(
    transaction: Prisma.TransactionClient,
    input: ConsumeStoredRateLimitInput,
    rules: readonly RateLimitRule[],
  ): Promise<RateLimitRecord[]> {
    const now = input.now;

    const nowMs = now.getTime();

    await transaction.$executeRaw(
      Prisma.sql`
        INSERT INTO public.rate_limits (scope, key_hash, rule_id, count, reset_at, updated_at)
        VALUES ${Prisma.join(
          rules.map((rule) =>
            toInsertValues(
              input.scope,
              input.keyHash,
              rule,
              new Date(nowMs + rule.windowMs),
              now,
            ),
          ),
        )}
        ON CONFLICT (scope, key_hash, rule_id) DO NOTHING
      `,
    );

    const records = await transaction.$queryRaw<StoredRateLimit[]>(Prisma.sql`
      SELECT rule_id AS "ruleId", count, reset_at AS "resetAt"
      FROM public.rate_limits
      WHERE scope = ${input.scope}
        AND key_hash = ${input.keyHash}
        AND rule_id IN (${Prisma.join(rules.map((rule) => rule.id))})
      ORDER BY rule_id
      FOR UPDATE
    `);

    const recordsByRuleId = new Map(records.map((record) => [record.ruleId, record]));

    return rules.map((rule) => {
      const record = recordsByRuleId.get(rule.id);

      if (!record) {
        throw new Error("Rate-limit record could not be locked.");
      }

      return { rule, record };
    });
  }

  private async resetExpiredRecords(
    transaction: Prisma.TransactionClient,
    input: ConsumeStoredRateLimitInput,
    records: readonly RateLimitRecord[],
  ) {
    const now = input.now;

    const nowMs = now.getTime();

    for (const { rule, record } of records) {
      if (record.resetAt.getTime() <= nowMs) {
        record.count = 0;
        record.resetAt = new Date(nowMs + rule.windowMs);

        await transaction.$executeRaw`
          UPDATE public.rate_limits
          SET count = 0, reset_at = ${record.resetAt}, updated_at = ${now}
          WHERE scope = ${input.scope}
            AND key_hash = ${input.keyHash}
            AND rule_id = ${rule.id}
        `;
      }
    }
  }

  private findExhaustedRecord(records: readonly RateLimitRecord[]) {
    let exhaustedRecord: RateLimitRecord | undefined;

    for (const candidate of records) {
      if (candidate.record.count < candidate.rule.limit) {
        continue;
      }

      // If several limits are full, wait for the one that resets last.
      if (
        !exhaustedRecord ||
        candidate.record.resetAt.getTime() > exhaustedRecord.record.resetAt.getTime()
      ) {
        exhaustedRecord = candidate;
      }
    }

    return exhaustedRecord;
  }

  private async incrementRecords(
    transaction: Prisma.TransactionClient,
    input: ConsumeStoredRateLimitInput,
    records: readonly RateLimitRecord[],
  ) {
    for (const { rule } of records) {
      await transaction.$executeRaw`
        UPDATE public.rate_limits
        SET count = count + 1, updated_at = ${input.now}
        WHERE scope = ${input.scope}
          AND key_hash = ${input.keyHash}
          AND rule_id = ${rule.id}
      `;
    }
  }
}
