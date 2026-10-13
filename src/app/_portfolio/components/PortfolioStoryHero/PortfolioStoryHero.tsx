import { ArrowDown, ArrowUpRight, MessageCircle } from "lucide-react";
import { AssistantTriggerButton } from "@/app/_assistant/components/AssistantTriggerButton";
import type { HomePresentationData } from "../../data/types";
import { StoryImage } from "../StoryImage/StoryImage";

export function PortfolioStoryHero({ home }: { home: HomePresentationData }) {
  const primary = home.projects.jpscents;

  const secondary = home.projects.debbyArts;

  return (
    <section className="story-hero" aria-labelledby="story-title" id="top">
      <div className="story-hero-copy">
        <p className="story-hero-eyebrow">
          {home.profile.name} · {home.profile.title}
        </p>
        <h1 id="story-title">
          Understand the problem.
          <br />
          <span>Build what matters.</span>
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
        {secondary.cover && (
          <a
            href={`#${secondary.slug}`}
            className="story-plane story-plane-secondary"
            aria-label={`Explore ${secondary.title}`}
          >
            <div className="story-plane-image">
              <StoryImage
                src={secondary.cover.source}
                alt={secondary.cover.altText}
                sizes="(max-width: 700px) 50vw, 400px"
              />
            </div>
            <span className="story-plane-caption">
              {secondary.title}
              <ArrowUpRight aria-hidden="true" size={16} />
            </span>
          </a>
        )}
        {primary.cover && (
          <a
            href={`#${primary.slug}`}
            className="story-plane story-plane-primary"
            aria-label={`Explore ${primary.title}`}
          >
            <div className="story-plane-image">
              <StoryImage
                src={primary.cover.source}
                alt={primary.cover.altText}
                sizes="(max-width: 700px) 90vw, 760px"
                priority
              />
            </div>
            <span className="story-plane-caption">
              {primary.title}
              <ArrowUpRight aria-hidden="true" size={16} />
            </span>
          </a>
        )}
        <div className="story-plane story-plane-assistant">
          <MessageCircle aria-hidden="true" size={25} />
          <strong>
            A portfolio you <br />
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
