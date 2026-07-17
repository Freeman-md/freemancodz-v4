import type { EducationContent } from "@/features/portfolio/types";
import { parseObject, readString } from "./shared";

export function parseEducationContent(value: unknown, key: string): EducationContent {
  const content = parseObject(value, `block: ${key}`);
  return {
    current: readString(content, "current", `block: ${key}`),
    previous: readString(content, "previous", `block: ${key}`),
    research: readString(content, "research", `block: ${key}`),
    support: readString(content, "support", `block: ${key}`),
  };
}
