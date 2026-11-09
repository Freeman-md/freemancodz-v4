"use client";

import { useState, type ReactNode } from "react";
import type { ProjectKind } from "@/contracts/public-portfolio.contract";

const filters = [
  { id: "all", label: "All" },
  { id: "real-project", label: "Real projects" },
  { id: "exploration", label: "Explorations" },
] as const;

export function ProjectFilters({
  projects,
}: {
  projects: readonly { slug: string; kind: ProjectKind; card: ReactNode }[];
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  const visible =
    filter === "all" ? projects : projects.filter((project) => project.kind === filter);

  return (
    <>
      <div className="catalogue-filters" role="group" aria-label="Filter projects">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            aria-controls="catalogue-results"
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {visible.length} projects shown
      </p>
      <div id="catalogue-results" className="home-project-grid catalogue-grid">
        {visible.map(({ slug, card }) => (
          <div key={slug} className="catalogue-result">
            {card}
          </div>
        ))}
      </div>
    </>
  );
}
