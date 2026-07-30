import "server-only";
import { findRequiredContentBlockByKey } from "@/server/modules/portfolio/repositories/content-block.repository";
import { findExperiences } from "@/server/modules/portfolio/repositories/experience.repository";
import { findPrinciplesBySection } from "@/server/modules/portfolio/repositories/principle.repository";
import { findFeaturedProjects } from "@/server/modules/portfolio/repositories/project.repository";
import { findServices } from "@/server/modules/portfolio/repositories/service.repository";
import {
  mapCurrentDirectionBlock,
  mapHeroBlock,
  mapPhilosophyBlock,
} from "@/server/modules/portfolio/mappers/content-block.mapper";
import {
  mapExperience,
  mapPrinciple,
  mapProject,
  mapService,
} from "@/server/modules/portfolio/mappers/portfolio-view.mapper";
import type { HomePageData } from "@/server/modules/portfolio/models/portfolio-view.model";

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
