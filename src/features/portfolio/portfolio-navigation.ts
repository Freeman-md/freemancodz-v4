const legacySections: Record<string, string> = {
  "home-work": "work",
  "work-relevant": "work",
  "work-connects": "systems",
  "about-thinking": "systems",
  "home-improve": "systems",
  "home-audit": "audit",
  "home-cta": "audit",
  "work-cta": "audit",
  "about-cta": "audit",
  "audit-cta": "audit",
  "audit-proof": "work",
};

export function portfolioDestination(page: "work" | "about" | "audit", hash: string) {
  const anchor = hash.replace(/^#/, "");

  return `/#${legacySections[anchor] ?? (anchor || page)}`;
}
