import { z } from "zod";

export const searchIndexWorkerResultSchema = z.object({
  claimed: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  retried: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
});

export const searchIndexWorkerErrorSchema = z.object({ error: z.string() });
