import "server-only";

import { createHmac } from "node:crypto";
import type {
  ConsumeRateLimitInput,
  RateLimitResult,
  RateLimitStore,
} from "./rate-limit.types";
import { requireNonEmpty, validateRateLimitRules } from "./validation";

export class RateLimitService {
  constructor(
    private readonly repository: RateLimitStore,
    private readonly getHmacSecret: () => string,
  ) {}

  async consume(input: ConsumeRateLimitInput): Promise<RateLimitResult> {
    requireNonEmpty(input.scope, "Rate-limit scope");
    requireNonEmpty(input.identifier, "Rate-limit identifier");
    validateRateLimitRules(input.rules);

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
