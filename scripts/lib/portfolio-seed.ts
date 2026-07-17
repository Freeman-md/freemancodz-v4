import { experiences } from "@/data/experience";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import type { PrismaClient } from "@/generated/prisma/client";

export type PortfolioSeedData = {
  profiles: {
    name: string;
    headline: string;
    intro: string;
    heroNote: string;
    philosophyQuestion: string;
    aboutHeadline: string;
    currentDirection: string;
    currentDirectionSupport: string;
  }[];
  educations: {
    current: string;
    previous: string;
    research: string;
    support: string;
  }[];
  principles: { section: "home" | "about"; title: string; body: string; position: number }[];
  services: {
    title: string;
    lead: string;
    description: string;
    cta: string;
    assistantPrompt?: string;
    position: number;
  }[];
  contentItems: {
    section: "about_intro" | "work_process" | "outside_engineering";
    title: string | null;
    body: string;
    position: number;
  }[];
  experiences: {
    title: string;
    company: string;
    dates: string;
    location: string | null;
    category: string;
    focus: string;
    position: number;
  }[];
  projects: {
    title: string;
    summary: string;
    category: string;
    role: string;
    outcome: string;
    detail: string;
    future: string | null;
    collaboration: string | null;
    positioning: string | null;
    featured: boolean;
    position: number;
    stacks: string[];
    links: { label: string; href: string }[];
  }[];
};

export function getPortfolioSeedData(): PortfolioSeedData {
  return {
    profiles: [
      {
        name: profile.name,
        headline: profile.headline,
        intro: profile.intro,
        heroNote: profile.heroNote,
        philosophyQuestion: profile.philosophyQuestion,
        aboutHeadline: profile.aboutHeadline,
        currentDirection: profile.currentDirection,
        currentDirectionSupport: profile.currentDirectionSupport,
      },
    ],
    educations: [profile.education],
    principles: [
      ...profile.principles.map((principle, position) => ({
        ...principle,
        section: "home" as const,
        position,
      })),
      ...profile.aboutPrinciples.map((principle, position) => ({
        ...principle,
        section: "about" as const,
        position,
      })),
    ],
    services: profile.services.map((service, position) => ({
      ...service,
      position,
    })),
    contentItems: [
      ...profile.aboutIntro.map((body, position) => ({
        section: "about_intro" as const,
        title: null,
        body,
        position,
      })),
      ...profile.workProcess.map((body, position) => ({
        section: "work_process" as const,
        title: null,
        body,
        position,
      })),
      ...profile.outsideEngineering.map((item, position) => ({
        section: "outside_engineering" as const,
        title: item.title,
        body: item.description,
        position,
      })),
    ],
    experiences: experiences.map((experience, position) => ({
      ...experience,
      location: experience.location ?? null,
      position,
    })),
    projects: projects.map((project, position) => ({
      title: project.title,
      summary: project.summary,
      category: project.category,
      role: project.role,
      outcome: project.outcome,
      detail: project.detail,
      future: project.future ?? null,
      collaboration: project.collaboration ?? null,
      positioning: project.positioning ?? null,
      featured: project.featured ?? false,
      position,
      stacks: [...project.stack],
      links: project.links.map((link) => ({ ...link })),
    })),
  };
}

export async function seedPortfolioData(client: PrismaClient) {
  const data = getPortfolioSeedData();

  try {
    await client.$transaction(async (transaction) => {
      await transaction.profile.deleteMany();
      await transaction.education.deleteMany();
      await transaction.principle.deleteMany();
      await transaction.service.deleteMany();
      await transaction.contentItem.deleteMany();
      await transaction.experience.deleteMany();
      await transaction.project.deleteMany();

      await transaction.profile.createMany({ data: data.profiles });
      await transaction.education.createMany({ data: data.educations });
      await transaction.principle.createMany({ data: data.principles });
      await transaction.service.createMany({ data: data.services });
      await transaction.contentItem.createMany({ data: data.contentItems });
      await transaction.experience.createMany({ data: data.experiences });
      await transaction.project.createMany({ data: data.projects });
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Portfolio seed failed: ${detail}`, { cause: error });
  } finally {
    await client.$disconnect();
  }

  return data;
}
