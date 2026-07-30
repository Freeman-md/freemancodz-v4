import "server-only";
import {
  findContentBlocksBySection,
  findRequiredContentBlockByKey,
} from "@/server/modules/portfolio/repositories/content-block.repository";
import { findPrinciplesBySection } from "@/server/modules/portfolio/repositories/principle.repository";
import {
  mapAboutHeaderBlock,
  mapEducationBlock,
  mapOutsideEngineeringBlock,
  mapTextBlock,
} from "@/server/modules/portfolio/mappers/content-block.mapper";
import { mapPrinciple } from "@/server/modules/portfolio/mappers/portfolio-view.mapper";
import type { AboutPageData } from "@/server/modules/portfolio/models/portfolio-view.model";

export async function getAboutPageData(): Promise<AboutPageData> {
  const [
    header,
    education,
    intro,
    workProcess,
    outsideEngineering,
    principles,
  ] = await Promise.all([
    findRequiredContentBlockByKey("about.header"),
    findRequiredContentBlockByKey("about.education"),
    findContentBlocksBySection("ABOUT", "ABOUT_INTRO"),
    findContentBlocksBySection("ABOUT", "WORK_PROCESS"),
    findContentBlocksBySection("ABOUT", "OUTSIDE_ENGINEERING"),
    findPrinciplesBySection("about"),
  ]);
  return {
    header: mapAboutHeaderBlock(header),
    education: mapEducationBlock(education),
    intro: intro.map(mapTextBlock),
    workProcess: workProcess.map(mapTextBlock),
    outsideEngineering: outsideEngineering.map(mapOutsideEngineeringBlock),
    principles: principles.map(mapPrinciple),
  };
}
