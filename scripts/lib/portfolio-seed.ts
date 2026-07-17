import { experiences } from "@/data/experience";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import type { PrismaClient } from "@/generated/prisma/client";

export type PortfolioSeedData = {
  contentBlocks: {
    key: string;
    page: "HOME" | "ABOUT";
    section:
      | "HERO"
      | "PHILOSOPHY"
      | "CURRENT_DIRECTION"
      | "ABOUT_HEADER"
      | "ABOUT_INTRO"
      | "EDUCATION"
      | "WORK_PROCESS"
      | "OUTSIDE_ENGINEERING";
    position: number;
    content: Record<string, string>;
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
    contentBlocks: [
      {
        key: "home.hero",
        page: "HOME",
        section: "HERO",
        position: 0,
        content: {
          name: profile.name,
          headline: profile.headline,
          intro: profile.intro,
          heroNote: profile.heroNote,
        },
      },
      {
        key: "home.philosophy",
        page: "HOME",
        section: "PHILOSOPHY",
        position: 0,
        content: { philosophyQuestion: profile.philosophyQuestion },
      },
      {
        key: "home.current-direction",
        page: "HOME",
        section: "CURRENT_DIRECTION",
        position: 0,
        content: {
          currentDirection: profile.currentDirection,
          currentDirectionSupport: profile.currentDirectionSupport,
        },
      },
      {
        key: "about.header",
        page: "ABOUT",
        section: "ABOUT_HEADER",
        position: 0,
        content: { aboutHeadline: profile.aboutHeadline },
      },
      {
        key: "about.education",
        page: "ABOUT",
        section: "EDUCATION",
        position: 0,
        content: { ...profile.education },
      },
      ...profile.aboutIntro.map((body, position) => ({
        key: `about.intro.${position}`,
        page: "ABOUT" as const,
        section: "ABOUT_INTRO" as const,
        position,
        content: { body },
      })),
      ...profile.workProcess.map((body, position) => ({
        key: `about.work-process.${position}`,
        page: "ABOUT" as const,
        section: "WORK_PROCESS" as const,
        position,
        content: { body },
      })),
      ...profile.outsideEngineering.map((item, position) => ({
        key: `about.outside-engineering.${position}`,
        page: "ABOUT" as const,
        section: "OUTSIDE_ENGINEERING" as const,
        position,
        content: { ...item },
      })),
    ],
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
      await transaction.contentBlock.deleteMany();
      await transaction.principle.deleteMany();
      await transaction.service.deleteMany();
      await transaction.experience.deleteMany();
      await transaction.project.deleteMany();

      await transaction.contentBlock.createMany({ data: data.contentBlocks });
      await transaction.principle.createMany({ data: data.principles });
      await transaction.service.createMany({ data: data.services });
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
