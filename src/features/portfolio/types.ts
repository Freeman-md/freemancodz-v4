import type { Experience, ProfileService, Project } from "@/types/content";

export type Principle = {
  title: string;
  body: string;
};

export type HeroContent = {
  name: string;
  headline: string;
  intro: string;
  heroNote: string;
};

export type PhilosophyContent = {
  philosophyQuestion: string;
};

export type CurrentDirectionContent = {
  currentDirection: string;
  currentDirectionSupport: string;
};

export type AboutHeaderContent = {
  aboutHeadline: string;
};

export type EducationContent = {
  current: string;
  previous: string;
  research: string;
  support: string;
};

export type TextBlockContent = { body: string };
export type OutsideEngineeringContent = { title: string; description: string };

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
