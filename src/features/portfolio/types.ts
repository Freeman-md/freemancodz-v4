import type { Experience, ProfileService, Project } from "@/types/content";
import type { AboutHeaderContent } from "./schemas/content-blocks/about-header.schema";
import type { CurrentDirectionContent } from "./schemas/content-blocks/current-direction.schema";
import type { EducationContent } from "./schemas/content-blocks/education.schema";
import type { HeroContent } from "./schemas/content-blocks/hero.schema";
import type { OutsideEngineeringContent } from "./schemas/content-blocks/outside-engineering.schema";
import type { PhilosophyContent } from "./schemas/content-blocks/philosophy.schema";
import type { TextBlockContent } from "./schemas/content-blocks/text-block.schema";

export type Principle = {
  title: string;
  body: string;
};

export type {
  AboutHeaderContent,
  CurrentDirectionContent,
  EducationContent,
  HeroContent,
  OutsideEngineeringContent,
  PhilosophyContent,
  TextBlockContent,
};

export type HomePageData = {
  hero: HeroContent;
  philosophy: PhilosophyContent;
  currentDirection: CurrentDirectionContent;
  services: ProfileService[];
  principles: Principle[];
  featuredProjects: Project[];
  experiences: Experience[];
};

export type WorkPageData = {
  featuredProjects: Project[];
  otherProjects: Project[];
};

export type AboutPageData = {
  header: AboutHeaderContent;
  education: EducationContent;
  intro: TextBlockContent[];
  workProcess: TextBlockContent[];
  outsideEngineering: OutsideEngineeringContent[];
  principles: Principle[];
};
