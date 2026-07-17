import type { AboutHeaderContent } from "@/features/portfolio/types";
import { parseObject, readString } from "./shared";

export function parseAboutHeaderContent(value: unknown, key: string): AboutHeaderContent {
  const content = parseObject(value, `block: ${key}`);
  return { aboutHeadline: readString(content, "aboutHeadline", `block: ${key}`) };
}
