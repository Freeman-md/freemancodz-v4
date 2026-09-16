import type { AboutPresentationData, HomePresentationData } from "../models/portfolio-presentation";
import { StoryDisclosure } from "./StoryDisclosure";
import { StoryImage } from "./StoryImage";

export function PortfolioFreemanScene({
  about,
  home,
}: {
  about: AboutPresentationData;
  home: HomePresentationData;
}) {
  const monogram = (
    <div className="story-monogram" role="img" aria-label={about.profile.name}>
      <span>
        {about.profile.name
          .split(" ")
          .map((part) => part[0])
          .join("")}
      </span>
      <p>
        People. Products.
        <br />
        The connections between.
      </p>
    </div>
  );

  return (
    <section className="story-person story-container" id="about" aria-labelledby="person-title">
      <div className="story-person-visual">
        <div className="story-portrait">
          {about.profile.coverImage ? (
            <StoryImage
              src={about.profile.coverImage}
              alt={about.profile.name}
              sizes="(max-width:700px) 90vw, 500px"
              fallback={monogram}
            />
          ) : (
            monogram
          )}
        </div>
        <p>
          {about.profile.name}
          <span>{about.profile.title}</span>
        </p>
      </div>
      <div className="story-person-copy">
        <h2 id="person-title">
          Hi, I’m {about.profile.name.split(" ")[0]}.<br />
          <span>I join the dots.</span>
        </h2>
        <p>{about.journey.copy}</p>
        <div className="story-principles">
          {about.profile.processPrinciples.map((principle) => (
            <p key={principle.label}>{principle.label}</p>
          ))}
        </div>
        <StoryDisclosure title={about.journey.title} id="about-journey">
          <p>{about.hero.copy}</p>
          <div className="story-experiences">
            {about.experiences.map((experience) => (
              <div key={experience.title}>
                <h3>{experience.title}</h3>
                <p>{experience.copy}</p>
              </div>
            ))}
          </div>
        </StoryDisclosure>
        <StoryDisclosure title="How I work" id="about-work">
          <p>{about.process.copy}</p>
          <ol className="story-process-list">
            {about.process.icons.map((step) => (
              <li key={step.label}>
                <strong>{step.label}</strong>
                <span>{step.copy}</span>
              </li>
            ))}
          </ol>
          <p>{home.hero.copy}</p>
        </StoryDisclosure>
        <StoryDisclosure title="What I’m exploring" id="about-explore">
          <h3>{about.exploration.title}</h3>
          {about.exploration.copy && <p>{about.exploration.copy}</p>}
          <div className="story-experiences">
            {about.profile.controlPrinciples.map((item) => (
              <div key={item.label}>
                <h4>{item.label}</h4>
                <p>{item.copy}</p>
              </div>
            ))}
          </div>
        </StoryDisclosure>
        <StoryDisclosure title={about.outsideEngineering.title} id="about-outside">
          <p>{about.outsideEngineering.copy}</p>
          <div className="story-interests">
            {about.outsideEngineering.media.map((media) => (
              <figure key={media.source}>
                <div>
                  {media.type === "VIDEO" ? (
                    <video src={media.source} controls preload="none" aria-label={media.altText} />
                  ) : (
                    <StoryImage
                      src={media.source}
                      alt={media.altText}
                      sizes="(max-width:700px) 40vw, 240px"
                    />
                  )}
                </div>
                <figcaption>{media.label}</figcaption>
              </figure>
            ))}
          </div>
        </StoryDisclosure>
      </div>
    </section>
  );
}
