import { siteConfig } from "../_config/site-metadata";

const homepageAnchors = new Set([
  "top",
  "work",
  "experience",
  "services",
  "testimonials",
  "outside-engineering",
  "contact",
  "jpscents",
  "debby-arts",
  "pay4me-withradius",
]);

const legacyAnchors = new Map([
  ["/#home-work", "/#work"],
  ["/#work-relevant", "/#work"],
  ["/work", "/#work"],
  ["/work#work-relevant", "/#work"],
  ["/#about-journey", "/#experience"],
  ["/about#about-journey", "/#experience"],
  ["/#about-outside", "/#outside-engineering"],
  ["/about#about-outside", "/#outside-engineering"],
  ["/#in-their-words", "/#testimonials"],
  ["/#audit-proof", "/#work"],
]);

export function assistantSourceDestination(url: string) {
  const base = siteConfig.url.origin;

  let source: URL;

  try {
    source = new URL(url, base);
  } catch {
    return null;
  }

  if (source.protocol !== "https:" && source.protocol !== "http:") {
    return null;
  }

  if (source.origin !== base) {
    return url;
  }

  const path = source.pathname.replace(/\/$/, "") || "/";

  const legacy = legacyAnchors.get(path + source.hash);

  if (legacy) {
    return legacy;
  }

  if (path === "/" && (!source.hash || homepageAnchors.has(source.hash.slice(1)))) {
    return path + source.search + source.hash;
  }

  return null;
}
