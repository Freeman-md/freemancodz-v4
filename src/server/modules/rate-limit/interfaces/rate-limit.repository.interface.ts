import type { ConsumeStoredRateLimitInput, RateLimitResult } from "../rate-limit.types";

export interface IRateLimitRepository {
  consume(input: ConsumeStoredRateLimitInput): Promise<RateLimitResult>;
}
