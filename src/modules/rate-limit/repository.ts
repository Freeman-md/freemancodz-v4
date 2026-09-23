import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type {
  ConsumeStoredRateLimitInput,
  RateLimitRule,
  RateLimitResult,
  RateLimitStore,
} from "./rate-limit.types";

type StoredRateLimit = {
  ruleId: string;
  count: number;
  resetAt: Date;
};

function requireNonEmpty(value: string, name: string) {
  if (!value.trim()) {
    throw new Error(`${name} must not be empty.`);
  }
}

function validateInput(input: ConsumeStoredRateLimitInput) {
  requireNonEmpty(input.scope, "Rate-limit scope");
  requireNonEmpty(input.keyHash, "Rate-limit key hash");

  if (!Number.isFinite(input.now.getTime())) {
    throw new Error("Rate-limit time must be valid.");
  }

  if (!input.rules.length) {
    throw new Error("At least one rate-limit rule is required.");
  }

  const ruleIds = new Set<string>();

  for (const rule of input.rules) {
    requireNonEmpty(rule.id, "Rate-limit rule id");

    if (ruleIds.has(rule.id)) {
      throw new Error("Rate-limit rule ids must be unique.");
    }

    if (!Number.isInteger(rule.limit) || rule.limit <= 0) {
      throw new Error("Rate-limit rule limits must be positive integers.");
    }

    if (!Number.isFinite(rule.windowMs) || rule.windowMs <= 0) {
      throw new Error("Rate-limit rule windows must be positive finite durations.");
    }

    if (!Number.isFinite(input.now.getTime() + rule.windowMs)) {
      throw new Error("Rate-limit rule window exceeds the supported time range.");
    }

    ruleIds.add(rule.id);
  }
}

function sortRules(rules: readonly RateLimitRule[]) {
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
    validateInput(input);

    const rules = sortRules(input.rules);

    const now = input.now;

    return this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw(
        Prisma.sql`
          INSERT INTO public.rate_limits (scope, key_hash, rule_id, count, reset_at, updated_at)
          VALUES ${Prisma.join(
            rules.map((rule) =>
              toInsertValues(
                input.scope,
                input.keyHash,
                rule,
                new Date(now.getTime() + rule.windowMs),
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

      if (records.length !== rules.length) {
        throw new Error("Rate-limit records could not be locked.");
      }

      const recordsByRuleId = new Map(records.map((record) => [record.ruleId, record]));

      for (const rule of rules) {
        const record = recordsByRuleId.get(rule.id);

        if (!record) {
          throw new Error("Rate-limit record is missing.");
        }

        if (record.resetAt.getTime() <= now.getTime()) {
          record.count = 0;
          record.resetAt = new Date(now.getTime() + rule.windowMs);

          await transaction.$executeRaw`
            UPDATE public.rate_limits
            SET count = 0, reset_at = ${record.resetAt}, updated_at = ${now}
            WHERE scope = ${input.scope}
              AND key_hash = ${input.keyHash}
              AND rule_id = ${rule.id}
          `;
        }
      }

      const exhausted = rules
        .map((rule) => ({ rule, record: recordsByRuleId.get(rule.id)! }))
        .filter(({ rule, record }) => record.count >= rule.limit)
        .sort((left, right) => right.record.resetAt.getTime() - left.record.resetAt.getTime())[0];

      if (exhausted) {
        return {
          allowed: false,
          limit: exhausted.rule.limit,
          remaining: 0,
          resetAt: exhausted.record.resetAt.getTime(),
        };
      }

      for (const rule of rules) {
        await transaction.$executeRaw`
          UPDATE public.rate_limits
          SET count = count + 1, updated_at = ${now}
          WHERE scope = ${input.scope}
            AND key_hash = ${input.keyHash}
            AND rule_id = ${rule.id}
        `;
      }

      return { allowed: true };
    });
  }
}
