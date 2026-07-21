import type { ProjectLinks } from "./schema";

export type ProfileService = { title: string; lead: string; description: string; cta: string; assistantPrompt?: string };
export type Experience = { title: string; company: string; dates: string; location?: string; focus: string; category: string };
export type Project = { title: string; summary: string; category: string; stack: string[]; role: string; outcome: string; links: ProjectLinks; detail: string; future?: string; collaboration?: string; positioning?: string; featured?: boolean };
import type { AboutHeaderContent } from "./schema";
import type { CurrentDirectionContent } from "./schema";
import type { EducationContent } from "./schema";
import type { HeroContent } from "./schema";
import type { OutsideEngineeringContent } from "./schema";
import type { PhilosophyContent } from "./schema";
import type { TextBlockContent } from "./schema";

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
