import type { ZodType } from "zod";

export function parseContentBlock<T>(schema: ZodType<T>, value: unknown, key: string): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new Error(`Invalid content stored for block: ${key}`, { cause: result.error });
  }

  return result.data;
}
