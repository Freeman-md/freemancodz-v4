import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Code2 } from "lucide-react";
import type { ProjectKind } from "@/contracts/public-portfolio.contract";
import { QuestionChips } from "./QuestionChips";

type CardArtwork = { source: string; altText: string };

export type ProjectCardData = {
  slug: string;
  title: string;
  company?: string;
  category: string;
  kind: ProjectKind;
  cover: CardArtwork;
  featured?: { problem: string; outcome: string; questions: readonly string[] };
  links: readonly { kind: "live-site" | "repository"; label: string; url: string }[];
  questions: readonly string[];
};

export function ProjectCard({
  project,
  featured = false,
}: {
  project: ProjectCardData;
  featured?: boolean;
}) {
  const art = project.cover;

  const excerpts = featured ? project.featured : undefined;

  const context = [project.company, project.category].filter(Boolean).join(" · ");

  return (
    <article className="home-project">
      <div className="home-project-art">
        <Image
          src={art.source}
          alt={art.altText}
          fill
          sizes="(max-width: 700px) calc(100vw - 48px), 408px"
        />
        {!featured && (
          <p className="catalogue-card-kind">
            {project.kind === "exploration" ? "Exploration" : "Real project"}
          </p>
        )}
        <div className="home-project-actions">
          <Link
            className="home-art-action"
            href={`/work/${project.slug}`}
            aria-label={`Read ${project.title} case study`}
            data-label="Read case study"
          >
            <BookOpen size={18} aria-hidden="true" />
          </Link>
          {project.links.map((link) => {
            const site = link.kind === "live-site";

            const Icon = site ? ArrowUpRight : Code2;

            return (
              <a
                key={link.url}
                className="home-art-action"
                href={link.url}
                aria-label={site ? `Visit ${project.title} website` : link.label}
                data-label={site ? "Visit website" : "View repository"}
              >
                <Icon size={18} aria-hidden="true" />
              </a>
            );
          })}
        </div>
      </div>
      <div className="home-project-copy">
        <div>
          <h3 id={project.slug} tabIndex={-1}>
            {project.title}
          </h3>
          <p>{context}</p>
        </div>
        {excerpts && (
          <div className="home-project-excerpts">
            <p>
              <strong>Problem</strong> {excerpts.problem}
            </p>
            <p>
              <strong>Outcome</strong> {excerpts.outcome}
            </p>
          </div>
        )}
        <QuestionChips
          subject={project.title}
          questions={excerpts?.questions ?? project.questions}
        />
      </div>
    </article>
  );
}
