import Image from "next/image";

import { AssistantTriggerButton } from "@/features/assistant/components/AssistantTriggerButton";
import { Container } from "@/shared/components/layout/Container";
import type { HomePresentationData, PortfolioProject } from "../models/portfolio-presentation";
import { PortfolioAction } from "./PortfolioAction";

function ProjectLink({ project, label }: { project: PortfolioProject; label: string }) {
  const href = project.externalLinks[0];

  if (!href) {
    return null;
  }

  return (
    <a
      aria-label={`${label}: ${project.title} (opens in a new tab)`}
      className="inline-flex min-h-12 items-center font-medium text-ink underline decoration-ink/30 underline-offset-8 hover:decoration-signal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-700 active:text-signal-900"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {label}
    </a>
  );
}

export function HomeRelevantWorkSection({
  projects,
  relevantWork,
}: Pick<HomePresentationData, "projects" | "relevantWork">) {
  const featured = projects.pay4Me;

  return (
    <section
      aria-labelledby="home-work-heading"
      className="bg-surface pb-16 lg:pb-24"
      id="home-work"
    >
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-ink/10 pt-12 lg:pt-16">
          <h2
            className="font-display text-4xl tracking-tight text-ink sm:text-5xl"
            id="home-work-heading"
          >
            {relevantWork.title}
          </h2>
          <div className="flex flex-wrap gap-4">
            {relevantWork.actions.map((action) => (
              <PortfolioAction
                action={{ ...action, variant: "LINK" }}
                className="h-auto min-h-12 max-w-full gap-3 whitespace-normal font-medium text-ink underline decoration-ink/30 underline-offset-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-700"
                key={action.label}
              />
            ))}
          </div>
        </div>
        <article className="mt-10 grid items-center gap-8 md:gap-12 lg:grid-cols-[3fr_2fr]">
          <div className="relative aspect-[8/5] overflow-hidden rounded-lg bg-white outline outline-1 -outline-offset-1 outline-ink/5">
            <Image
              alt={featured.cover?.altText ?? featured.title}
              className="object-contain"
              fill
              sizes="(min-width: 1200px) 660px, (min-width: 1024px) 56vw, calc(100vw - 40px)"
              src={featured.cover?.source ?? "/images/work/withradius-hero.jpg"}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted">{featured.category}</p>
            <h3 className="mt-3 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              {featured.title}
            </h3>
            <p className="mt-4 max-w-[56ch] text-base leading-7 text-muted">{featured.solution}</p>
            {featured.outcome ? (
              <p className="mt-4 text-base font-medium leading-7 text-ink">{featured.outcome}</p>
            ) : null}
            <div className="mt-4">
              <ProjectLink label="Visit project" project={featured} />
            </div>
          </div>
        </article>
        <div className="mt-12 grid gap-8 border-t border-ink/10 pt-8 md:grid-cols-2 md:gap-12">
          {(
            [
              ["assistant", projects.portfolioAssistant],
              ["email", projects.emailPa],
            ] as const
          ).map(([kind, project]) => (
            <article key={kind}>
              <h3 className="text-xl font-medium tracking-tight text-ink">{project.title}</h3>
              <p className="mt-3 max-w-[56ch] text-base leading-7 text-muted">{project.solution}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                {kind === "assistant" ? (
                  <AssistantTriggerButton
                    className="h-auto min-h-12 max-w-full whitespace-normal px-0 py-3 font-sans text-base font-medium text-ink underline decoration-ink/30 underline-offset-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-700"
                    variant="text"
                  >
                    Try the assistant
                  </AssistantTriggerButton>
                ) : null}
                <ProjectLink label="View project" project={project} />
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
