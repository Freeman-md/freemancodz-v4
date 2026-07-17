import "server-only";
import { findContentBlocksBySection, findRequiredContentBlockByKey } from "@/features/portfolio/data/content-blocks.query";
import { findPrinciplesBySection } from "@/features/portfolio/data/principles.query";
import { mapAboutHeaderBlock, mapEducationBlock, mapOutsideEngineeringBlock, mapTextBlock } from "@/features/portfolio/mappers/content-block.mapper";
import { mapPrinciple } from "@/features/portfolio/mappers/portfolio.mapper";
import type { AboutPageData } from "@/features/portfolio/types";

export async function getAboutPageData(): Promise<AboutPageData> {
  const [header, education, intro, workProcess, outsideEngineering, principles] = await Promise.all([
    findRequiredContentBlockByKey("about.header"), findRequiredContentBlockByKey("about.education"),
    findContentBlocksBySection("ABOUT", "ABOUT_INTRO"), findContentBlocksBySection("ABOUT", "WORK_PROCESS"),
    findContentBlocksBySection("ABOUT", "OUTSIDE_ENGINEERING"), findPrinciplesBySection("about"),
  ]);
  return { header: mapAboutHeaderBlock(header), education: mapEducationBlock(education), intro: intro.map(mapTextBlock), workProcess: workProcess.map(mapTextBlock), outsideEngineering: outsideEngineering.map(mapOutsideEngineeringBlock), principles: principles.map(mapPrinciple) };
}
