import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { publicPortfolioService } from "@/modules/composition";
import { technologyLabels } from "@/modules/portfolio/data/technology-labels";
import { Contact } from "../../_portfolio/components/Contact";
import { HomeAction } from "../../_portfolio/components/HomeAction";
import { QuestionChips } from "../../_portfolio/components/QuestionChips";
import { ProjectMedia } from "./_components/ProjectMedia";
import "./case-study.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "error";
export const dynamicParams = false;

export async function generateStaticParams() {
  const projects = await publicPortfolioService.listProjects();

  return projects.map(({ slug }) => ({ slug }));
}

const findProject = cache((slug: string) => publicPortfolioService.findProject(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await findProject((await params).slug);

  if (!project) {
    return {
      title: "Project not found",
      alternates: { canonical: null },
      robots: { index: false, follow: true },
    };
  }

  const url = `/work/${project.slug}`;

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: url },
    openGraph: {
      title: project.title,
      description: project.summary,
      url,
      images: [{ url: project.cover.source, alt: project.cover.altText }],
    },
  };
}

const footerCopy: Record<string, { title: string; description: string } | undefined> = {
  "product-development": {
    title: "Need a product that fits how you work?",
    description: "Let’s build a product around the way your customers and team work.",
  },
  "automation-ai": {
    title: "Have a workflow that takes too much manual work?",
    description:
      "Let’s connect the tools you already use and simplify the steps your team repeats.",
  },
};

export default async function CaseStudyPage({ params }: Props) {
  const project = await findProject((await params).slug);

  if (!project) {
    notFound();
  }

  const primary =
    project.links.find(({ kind }) => kind === "live-site") ??
    project.links.find(({ kind }) => kind === "repository");

  const exploration = project.kind === "exploration";

  const service = project.services[0];

  const { study } = project;

  const offer = study?.serviceOffer ??
    footerCopy[service.key] ?? {
      title: `Interested in ${service.title}?`,
      description: service.description,
    };

  return (
    <article className="case-study">
      <header className="case-banner" data-project={project.slug}>
        <Image src={project.cover.source} alt={project.cover.altText} fill sizes="100vw" preload />
        <div className="case-banner-copy">
          <h1>{project.title}</h1>
          <p>{project.summary}</p>
          {primary && <HomeAction href={primary.url}>{primary.label}</HomeAction>}
        </div>
      </header>

      <dl className="case-section case-facts case-pair" aria-label="Project facts">
        <div>
          <dt>Role</dt>
          <dd>{study?.role ?? project.category}</dd>
          <dd className="case-kind">
            {exploration ? "Exploration" : "Real project"} · {project.category}
          </dd>
        </div>
        <div>
          <dt>Service</dt>
          {project.services.map(({ key, title }) => (
            <dd key={key}>{title}</dd>
          ))}
        </div>
      </dl>

      {study && (
        <>
          <div className="case-section case-story case-pair">
            <section>
              <h2>The problem</h2>
              <p>{study.problem}</p>
            </section>
            <section>
              <h2>{exploration ? "What I explored" : "What I built"}</h2>
              <p>{study.contribution}</p>
            </section>
          </div>

          {study.beforeUrl && study.afterUrl && (
            <section className="case-section case-comparison" aria-labelledby="comparison">
              <h2 id="comparison">Before and after</h2>
              <div className="case-pair">
                <ProjectMedia source={study.beforeUrl} poster={project.cover} label="Before" />
                <ProjectMedia source={study.afterUrl} poster={project.cover} label="After" />
              </div>
            </section>
          )}

          <div className="case-section case-build">
            <section className="case-outcome">
              <h2>{exploration ? "What I learned" : "The outcome"}</h2>
              <p>{study.outcome}</p>
            </section>
            <div className="case-pair">
              <section>
                <h3>Key features</h3>
                <ul className="case-tags">
                  {study.capabilities.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Tools and technologies</h3>
                <ul className="case-tags case-tech">
                  {study.technologyKeys.map((key) => (
                    <li key={key}>{technologyLabels[key]}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </>
      )}

      <section className="case-section case-questions" aria-labelledby="case-questions">
        <h2 id="case-questions">Ask about {project.title}</h2>
        <QuestionChips subject={project.title} questions={project.questions} />
      </section>

      <Contact offer={{ ...offer, action: `Request ${service.title}` }} />
    </article>
  );
}
