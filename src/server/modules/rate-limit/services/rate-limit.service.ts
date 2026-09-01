import "server-only";

import { createHmac } from "node:crypto";
import type { IRateLimitRepository } from "../interfaces/rate-limit.repository.interface";
import type { IRateLimitService } from "../interfaces/rate-limit.service.interface";
import type { ConsumeRateLimitInput, RateLimitRule, RateLimitResult } from "../rate-limit.types";

function requireNonEmpty(value: string, name: string) {
  if (!value.trim()) {
    throw new Error(`${name} must not be empty.`);
  }
}

function validateRules(rules: readonly RateLimitRule[]) {
  if (!rules.length) {
    throw new Error("At least one rate-limit rule is required.");
  }

  const ruleIds = new Set<string>();

  for (const rule of rules) {
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

    ruleIds.add(rule.id);
  }
}

export class RateLimitService implements IRateLimitService {
  constructor(
    private readonly repository: IRateLimitRepository,
    private readonly getHmacSecret: () => string,
  ) {}

  async consume(input: ConsumeRateLimitInput): Promise<RateLimitResult> {
    requireNonEmpty(input.scope, "Rate-limit scope");
    requireNonEmpty(input.identifier, "Rate-limit identifier");
    validateRules(input.rules);

    const keyHash = createHmac("sha256", this.getHmacSecret())
      .update(JSON.stringify([input.scope, input.identifier]), "utf8")
      .digest("hex");

    return this.repository.consume({
      scope: input.scope,
      keyHash,
      rules: input.rules,
      now: new Date(),
    });
  }
}
