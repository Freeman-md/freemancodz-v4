import "server-only";
import { findRequiredContentBlockByKey } from "@/features/portfolio/server/content-blocks.query";
import { findExperiences } from "@/features/portfolio/server/experiences.query";
import { findPrinciplesBySection } from "@/features/portfolio/server/principles.query";
import { findFeaturedProjects } from "@/features/portfolio/server/projects.query";
import { findServices } from "@/features/portfolio/server/services.query";
import {
  mapCurrentDirectionBlock,
  mapHeroBlock,
  mapPhilosophyBlock,
} from "@/features/portfolio/server/content-block.mapper";
import {
  mapExperience,
  mapPrinciple,
  mapProject,
  mapService,
} from "@/features/portfolio/server/portfolio.mapper";
import type { HomePageData } from "@/features/portfolio/types";

export async function getHomePageData(): Promise<HomePageData> {
  const [
    hero,
    philosophy,
    currentDirection,
    services,
    principles,
    projects,
    experiences,
  ] = await Promise.all([
    findRequiredContentBlockByKey("home.hero"),
    findRequiredContentBlockByKey("home.philosophy"),
    findRequiredContentBlockByKey("home.current-direction"),
    findServices(),
    findPrinciplesBySection("home"),
    findFeaturedProjects(),
    findExperiences(),
  ]);
  return {
    hero: mapHeroBlock(hero),
    philosophy: mapPhilosophyBlock(philosophy),
    currentDirection: mapCurrentDirectionBlock(currentDirection),
    services: services.map(mapService),
    principles: principles.map(mapPrinciple),
    featuredProjects: projects.map(mapProject),
    experiences: experiences.map(mapExperience),
  };
}
