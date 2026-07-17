import type { HeroContent } from "@/features/portfolio/types";
import { parseObject, readString } from "./shared";

export function parseHeroContent(value: unknown, key: string): HeroContent {
  const content = parseObject(value, `block: ${key}`);
  return {
    name: readString(content, "name", `block: ${key}`),
    headline: readString(content, "headline", `block: ${key}`),
    intro: readString(content, "intro", `block: ${key}`),
    heroNote: readString(content, "heroNote", `block: ${key}`),
  };
}
