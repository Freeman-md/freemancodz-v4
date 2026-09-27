import { ArrowUpRight } from "lucide-react";
import type { PortfolioProject } from "../../data/types";

export function StoryProjectDetail({ project }: { project: PortfolioProject }) {
  return (
    <div className="story-project-detail">
      <div>
        <h4>The problem</h4>
        <p>{project.problem}</p>
      </div>
      <div>
        <h4>My contribution</h4>
        <p>{project.solution}</p>
      </div>
      {project.outcome && (
        <div>
          <h4>In production</h4>
          <p>{project.outcome}</p>
        </div>
      )}
      {project.externalLinks.length > 0 && (
        <div className="story-project-links">
          {project.externalLinks.map((href) => (
            <a className="story-text-link" href={href} key={href} target="_blank" rel="noreferrer">
              {new URL(href).hostname.replace("www.", "")}
              <ArrowUpRight aria-hidden="true" size={16} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
