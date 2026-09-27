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
        <PortfolioStoryHero home={home} horizon={work.projects.acrossTheHorizon} />
        <PortfolioWorkScene work={work} />
        <PortfolioSystemsScene home={home} work={work} />
        <PortfolioMoreWork work={work} />
        <PortfolioFreemanScene about={about} home={home} />
        <PortfolioAuditScene audit={audit} home={home} />
      </StoryMotion>
    </div>
  );
}
