import type { PhilosophyContent } from "@/features/portfolio/types";
import { parseObject, readString } from "./shared";

export function parsePhilosophyContent(value: unknown, key: string): PhilosophyContent {
  const content = parseObject(value, `block: ${key}`);
  return { philosophyQuestion: readString(content, "philosophyQuestion", `block: ${key}`) };
}
