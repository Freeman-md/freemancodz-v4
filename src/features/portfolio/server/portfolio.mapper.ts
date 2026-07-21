import type { Experience as ExperienceRecord, Principle as PrincipleRecord, Project as ProjectRecord, Service as ServiceRecord } from "@/generated/prisma/client";
import { parseProjectLinks } from "@/features/portfolio/helpers";
import type { Experience, ProfileService, Project } from "@/features/portfolio/types";
import type { Principle } from "@/features/portfolio/types";

export function mapService(record: ServiceRecord): ProfileService {
  return { title: record.title, lead: record.lead, description: record.description, cta: record.cta, assistantPrompt: record.assistantPrompt ?? undefined };
}

export function mapPrinciple(record: PrincipleRecord): Principle {
  return { title: record.title, body: record.body };
}

export function mapExperience(record: ExperienceRecord): Experience {
  return { title: record.title, company: record.company, dates: record.dates, location: record.location ?? undefined, category: record.category, focus: record.focus };
}

export function mapProject(record: ProjectRecord): Project {
  return {
    title: record.title, summary: record.summary, category: record.category, stack: [...record.stacks],
    role: record.role, outcome: record.outcome, links: parseProjectLinks(record.links, record.title),
    detail: record.detail, future: record.future ?? undefined, collaboration: record.collaboration ?? undefined,
    positioning: record.positioning ?? undefined, featured: record.featured,
  };
}
