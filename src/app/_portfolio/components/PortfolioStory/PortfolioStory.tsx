import type {
  AboutPresentationData,
  AuditPresentationData,
  HomePresentationData,
  WorkPresentationData,
} from "../../data/types";
import { PortfolioAuditScene } from "../PortfolioAuditScene/PortfolioAuditScene";
import { PortfolioFreemanScene } from "../PortfolioFreemanScene/PortfolioFreemanScene";
import { PortfolioMoreWork } from "../PortfolioMoreWork/PortfolioMoreWork";
import { PortfolioStoryHero } from "../PortfolioStoryHero/PortfolioStoryHero";
import { PortfolioSystemsScene } from "../PortfolioSystemsScene/PortfolioSystemsScene";
import { PortfolioWorkScene } from "../PortfolioWorkScene/PortfolioWorkScene";
import { PortfolioTestimonials } from "../PortfolioTestimonials/PortfolioTestimonials";
import { StoryMotion } from "./StoryMotion";

import "./PortfolioStory.css";
import "../StoryDisclosure/StoryDisclosure.css";
import "../StoryImage/StoryImage.css";
import "../StoryProjectDetail/StoryProjectDetail.css";
import "../PortfolioStoryHero/PortfolioStoryHero.css";
import "../PortfolioWorkScene/PortfolioWorkScene.css";
import "../PortfolioSystemsScene/PortfolioSystemsScene.css";
import "../PortfolioMoreWork/PortfolioMoreWork.css";
import "../PortfolioFreemanScene/PortfolioFreemanScene.css";
import "../PortfolioAuditScene/PortfolioAuditScene.css";
import "../PortfolioTestimonials/PortfolioTestimonials.css";

export function PortfolioStory({
  home,
  work,
  about,
  audit,
}: {
  home: HomePresentationData;
  work: WorkPresentationData;
  about: AboutPresentationData;
  audit: AuditPresentationData;
}) {
  return (
    <div className="portfolio-story">
      <StoryMotion>
        <PortfolioStoryHero home={home} />
        <PortfolioWorkScene work={work} />
        <PortfolioSystemsScene home={home} work={work} />
        <PortfolioMoreWork work={work} />
        <PortfolioTestimonials testimonials={home.testimonials} />
        <PortfolioFreemanScene about={about} home={home} />
        <PortfolioAuditScene audit={audit} home={home} />
      </StoryMotion>
    </div>
  );
}
