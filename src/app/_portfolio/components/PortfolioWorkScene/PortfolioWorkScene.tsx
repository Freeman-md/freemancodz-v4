import { ArrowUpRight } from "lucide-react";
import type { WorkPresentationData } from "../../data/types";
import { StoryImage } from "../StoryImage/StoryImage";
import { StoryDisclosure } from "../StoryDisclosure/StoryDisclosure";
import { StoryProjectDetail } from "../StoryProjectDetail/StoryProjectDetail";

export function PortfolioWorkScene({ work }: { work: WorkPresentationData }) {
  const project = work.projects.pay4Me;

  return (
    <section className="story-work story-container" id="work" aria-labelledby="work-title">
      <span id="home-work" />
      <span id="work-relevant" />
      <span id="audit-proof" />
      <div className="story-section-intro">
        <h2 id="work-title">
          Good software makes
          <br />
          <span>the next step clear.</span>
        </h2>
        <p>{project.problem}</p>
      </div>
      <article className="story-featured" id={project.slug}>
        <div className="story-featured-visual">
          {project.cover && (
            <div className="story-featured-screen">
              <StoryImage
                src={project.cover.source}
                alt={project.cover.altText}
                sizes="(min-width: 900px) 65vw, 100vw"
              />
            </div>
          )}
          <p className="story-visual-caption">{project.visualText}</p>
        </div>
        <div className="story-featured-copy">
          <h3>{project.title}</h3>
          <p className="story-category">{project.category}</p>
          <p>{project.solution}</p>
          {project.outcome && <p className="story-evidence">{project.outcome}</p>}
          <StoryDisclosure title="Inside the project">
            <StoryProjectDetail project={project} />
          </StoryDisclosure>
          {project.externalLinks[0] && (
            <a
              className="story-text-link"
              href={project.externalLinks[0]}
              target="_blank"
              rel="noreferrer"
            >
              Visit project
              <ArrowUpRight aria-hidden="true" size={17} />
            </a>
          )}
        </div>
      </article>
    </section>
  );
}
