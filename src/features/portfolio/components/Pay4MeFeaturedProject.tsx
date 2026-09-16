import Image from "next/image";
import { ArrowUpRight, ShieldCheck, Star, TrendingUp, Wrench } from "lucide-react";

import { CaseBadge, StudyPoint } from "@/features/portfolio/components/PortfolioProjectElements";
import { FeaturedProject } from "@/shared/components/marketing/FeaturedProject";
import { buttonVariants } from "@/shared/components/ui/Button";
import type { PortfolioProject } from "../models/portfolio-presentation";

export function Pay4MeFeaturedProject({ project }: { project: PortfolioProject }) {
  const href = project.externalLinks[0];

  return (
    <FeaturedProject
      actions={
        href ? (
          <a
            className={buttonVariants({ size: "lg", variant: "signal" })}
            href={href}
            rel="noreferrer"
            target="_blank"
          >
            Visit project
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        ) : null
      }
      meta={
        <>
          <CaseBadge>
            <Star aria-hidden="true" className="size-3 fill-current" /> Featured
          </CaseBadge>
          <CaseBadge>{project.category}</CaseBadge>
        </>
      }
      title={project.title}
      visual={
        <Image
          alt={project.cover?.altText ?? project.title}
          className="object-cover object-top"
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          src={project.cover?.source ?? "/images/work/withradius-hero.jpg"}
        />
      }
    >
      <StudyPoint icon={ShieldCheck} title="Problem">
        {project.problem}
      </StudyPoint>
      <StudyPoint icon={Wrench} title="Solution">
        {project.solution}
      </StudyPoint>
      <StudyPoint icon={TrendingUp} title="Outcome">
        {project.outcome}
      </StudyPoint>
    </FeaturedProject>
  );
}
