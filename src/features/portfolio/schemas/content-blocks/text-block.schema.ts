import type { TextBlockContent } from "@/features/portfolio/types";
import { parseObject, readString } from "./shared";

export function parseTextBlockContent(value: unknown, label: string): TextBlockContent {
  const content = parseObject(value, label);
  return { body: readString(content, "body", label) };
}
