import type { PortfolioPrincipleContent } from "./types";

export const principles: PortfolioPrincipleContent[] = [
  {
    key: "home-keep-it-simple",
    section: "home",
    title: "Keep it simple",
    body: "Simple architectures fail less often and are easier to debug when they do.",
    position: 0,
  },
  {
    key: "home-reliability-first",
    section: "home",
    title: "Reliability first",
    body: "Boring technology often yields the most exciting business outcomes when systems need to keep working.",
    position: 1,
  },
  {
    key: "about-clarity-before-complexity",
    section: "about",
    title: "Clarity before complexity",
    body: "Code is read far more often than it is written. Obvious logic usually wins over cleverness.",
    position: 0,
  },
  {
    key: "about-reliability-before-cleverness",
    section: "about",
    title: "Reliability before cleverness",
    body: "Systems should fail predictably. Boundaries, retries, and operational safety matter more than novelty.",
    position: 1,
  },
];
