import { z } from "zod";

export const portfolioAssetPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(1024)
  .refine(
    (value) => !value.split("/").some((segment) => segment === ".." || segment.length === 0),
    "Invalid asset path.",
  );
