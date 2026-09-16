import { ArrowDown, ArrowUpRight, MessageCircle } from "lucide-react";
import { AssistantTriggerButton } from "@/features/assistant/components/AssistantTriggerButton";
import type { HomePresentationData, PortfolioProject } from "../models/portfolio-presentation";
import { StoryImage } from "./StoryImage";

export function PortfolioStoryHero({
  home,
  horizon,
}: {
  home: HomePresentationData;
  horizon: PortfolioProject;
}) {
  return (
    <section className="story-hero" aria-labelledby="story-title" id="top">
      <div className="story-hero-copy">
        <h1 id="story-title">
          From first click.
          <br />
          <span>To a job well done.</span>
        </h1>
        <p>{home.hero.title}</p>
        <a href="#work" className="story-button">
          Explore my work
          <ArrowDown aria-hidden="true" size={17} />
        </a>
      </div>
      <div
        className="story-stage"
        aria-label="Selected interfaces and a working portfolio assistant"
      >
        {horizon.cover && (
          <a
            href={`#${horizon.slug}`}
            className="story-plane story-plane-horizon"
            aria-label={`Explore ${horizon.title}`}
          >
            <div className="story-plane-image">
              <StoryImage
                src={horizon.cover.source}
                alt={horizon.cover.altText}
                sizes="(max-width: 700px) 50vw, 400px"
              />
            </div>
            <span className="story-plane-caption">
              {horizon.title}
              <ArrowUpRight aria-hidden="true" size={16} />
            </span>
          </a>
        )}
        {home.projects.pay4Me.cover && (
          <a
            href="#work"
            className="story-plane story-plane-radius"
            aria-label={`Explore ${home.projects.pay4Me.title}`}
          >
            <div className="story-plane-image">
              <StoryImage
                src={home.projects.pay4Me.cover.source}
                alt={home.projects.pay4Me.cover.altText}
                sizes="(max-width: 700px) 90vw, 760px"
                priority
              />
            </div>
            <span className="story-plane-caption">
              {home.projects.pay4Me.title}
              <ArrowUpRight aria-hidden="true" size={16} />
            </span>
          </a>
        )}
        <div className="story-plane story-plane-assistant">
          <MessageCircle aria-hidden="true" size={25} />
          <strong>
            A portfolio you{" "}
            <br />
            can talk to.
          </strong>
          <p>Find the work that matters to you.</p>
          <AssistantTriggerButton className="story-button story-button-small" variant="primary">
            Ask my assistant
            <ArrowUpRight aria-hidden="true" size={16} />
          </AssistantTriggerButton>
        </div>
      </div>
      <div className="story-hero-signoff story-container">
        <p>
          {home.profile.name}
          <span>{home.profile.title}</span>
        </p>
        <p>
          Customer-facing products<span>Connected to what happens next</span>
        </p>
      </div>
    </section>
  );
}
