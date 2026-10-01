import type { ConsumeStoredRateLimitInput, RateLimitRule } from "./rate-limit.types";

export function requireNonEmpty(value: string, name: string) {
  if (!value.trim()) {
    throw new Error(`${name} must not be empty.`);
  }
}

export function validateRateLimitRules(rules: readonly RateLimitRule[]) {
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

export function validateStoredRateLimitInput(input: ConsumeStoredRateLimitInput) {
  requireNonEmpty(input.scope, "Rate-limit scope");
  requireNonEmpty(input.keyHash, "Rate-limit key hash");

  const nowMs = input.now.getTime();

  if (!Number.isFinite(nowMs)) {
    throw new Error("Rate-limit time must be valid.");
  }

  validateRateLimitRules(input.rules);

  for (const rule of input.rules) {
    if (!Number.isFinite(nowMs + rule.windowMs)) {
      throw new Error("Rate-limit rule window exceeds the supported time range.");
    }
  }
}
