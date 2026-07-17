import type { OutsideEngineeringContent } from "@/features/portfolio/types";
import { parseObject, readString } from "./shared";

export function parseOutsideEngineeringContent(value: unknown, label: string): OutsideEngineeringContent {
  const content = parseObject(value, label);
  return {
    title: readString(content, "title", label),
    description: readString(content, "description", label),
  };
}
