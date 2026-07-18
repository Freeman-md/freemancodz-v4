import type { SearchDocument } from "../types";
import { normalizeKeywords } from "../embedding-input";

export function document(
  value: Omit<SearchDocument, "documentIndex" | "keywords"> & { keywords: string[] },
): SearchDocument {
  return { ...value, documentIndex: 0, keywords: normalizeKeywords(value.keywords) };
}

export function sentences(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value)).join(" ");
}
