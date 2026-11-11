import { z } from "zod";

export const searchPortfolioArgumentsSchema = z
  .object({ query: z.string().trim().min(1).max(240) })
  .strict();
