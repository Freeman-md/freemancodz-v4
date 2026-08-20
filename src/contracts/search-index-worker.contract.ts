import { z } from "zod";

const skippedSearchIndexWorkerResultSchema = z.object({
  outcome: z.literal("skipped"),
});

const processedSearchIndexWorkerResultSchema = z.object({
  outcome: z.literal("processed"),
  attempt: z.number().int().positive(),
  documentCount: z.number().int().nonnegative(),
  chunkCount: z.number().int().nonnegative(),
  finalState: z.enum(["completed", "pending"]),
});

export const searchIndexWorkerResultSchema = z.discriminatedUnion("outcome", [
  skippedSearchIndexWorkerResultSchema,
  processedSearchIndexWorkerResultSchema,
]);

export const searchIndexWorkerErrorSchema = z.object({ error: z.string() });

export type SearchIndexWorkerResult = z.infer<typeof searchIndexWorkerResultSchema>;
