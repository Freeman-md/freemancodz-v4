import type { CurrentDirectionContent } from "@/features/portfolio/types";
import { parseObject, readString } from "./shared";

export function parseCurrentDirectionContent(value: unknown, key: string): CurrentDirectionContent {
  const content = parseObject(value, `block: ${key}`);
  return {
    currentDirection: readString(content, "currentDirection", `block: ${key}`),
    currentDirectionSupport: readString(content, "currentDirectionSupport", `block: ${key}`),
  };
}
