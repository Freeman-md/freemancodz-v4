export type RateLimitRule = {
  id: string;
  limit: number;
  windowMs: number;
};

export type ConsumeRateLimitInput = {
  scope: string;
  identifier: string;
  rules: readonly RateLimitRule[];
};

export type ConsumeStoredRateLimitInput = {
  scope: string;
  keyHash: string;
  rules: readonly RateLimitRule[];
  now: Date;
};

export type RateLimitResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      limit: number;
      remaining: 0;
      resetAt: number;
    };

export type RateLimitStore = {
  consume(input: ConsumeStoredRateLimitInput): Promise<RateLimitResult>;
};
