import type { ConsumeRateLimitInput, RateLimitResult } from "../rate-limit.types";

export interface IRateLimitService {
  consume(input: ConsumeRateLimitInput): Promise<RateLimitResult>;
}
