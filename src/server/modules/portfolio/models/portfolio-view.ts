import type { ProjectLinks } from "@/server/modules/portfolio/schemas/content-block.schema";

export type ProfileService = { title: string; lead: string; description: string; cta: string; assistantPrompt?: string };
export type Experience = { title: string; company: string; dates: string; location?: string; focus: string; category: string };
export type Project = { title: string; summary: string; category: string; stack: string[]; role: string; outcome: string; links: ProjectLinks; detail: string; future?: string; collaboration?: string; positioning?: string; featured?: boolean };
import type { AboutHeaderContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { CurrentDirectionContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { EducationContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { HeroContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { OutsideEngineeringContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { PhilosophyContent } from "@/server/modules/portfolio/schemas/content-block.schema";
import type { TextBlockContent } from "@/server/modules/portfolio/schemas/content-block.schema";

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
