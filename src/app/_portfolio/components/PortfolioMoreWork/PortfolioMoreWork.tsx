import type { WorkPresentationData } from "../../data/types";
import { StoryDisclosure } from "../StoryDisclosure/StoryDisclosure";
import { StoryImage } from "../StoryImage/StoryImage";
import { StoryProjectDetail } from "../StoryProjectDetail/StoryProjectDetail";

export function PortfolioMoreWork({ work }: { work: WorkPresentationData }) {
  const projects = [
    work.projects.acrossTheHorizon,
    work.projects.shifty,
    work.projects.selfHealing,
  ];

  return (
    <section
      className="story-more story-container"
      id="work-additional"
      aria-labelledby="more-title"
    >
      <h2 id="more-title">
        More ways to make
        <br />
        <span>things work better.</span>
      </h2>
      <div className="story-more-list">
        {projects.map((project) => (
          <article id={project.slug} key={project.slug}>
            <StoryDisclosure title={project.title}>
              <div className={project.cover ? "story-more-with-image" : undefined}>
                {project.cover && (
                  <div className="story-more-image">
                    <StoryImage
                      src={project.cover.source}
                      alt={project.cover.altText}
                      sizes="(max-width:700px) 90vw, 460px"
                    />
                  </div>
                )}
                <div>
                  <p className="story-category">{project.category}</p>
                  <StoryProjectDetail project={project} />
                </div>
              </div>
            </StoryDisclosure>
          </article>
        ))}
      </div>
    </section>
  );
}
