import type { Experience, Principle, Project, Service } from "@/generated/prisma/client";
import { mapContentBlockDocument } from "./content-block-document.mapper";
import type { SourceRecord } from "../interfaces/source-record.repository.interface";

export type IndexableSourceType =
  "content_blocks" | "projects" | "services" | "principles" | "experiences";

export type IndexDocument = {
  sourceType: IndexableSourceType;
  sourceId: string;
  title: string;
  category: string;
  url: string;
  keywords: string[];
  paragraphs: string[];
};

function nonEmpty(values: Array<string | null | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value?.trim()));
}

function mapProject(project: Project): IndexDocument {
  return {
    sourceType: "projects",
    sourceId: project.id,
    title: project.title,
    category: project.category,
    url: "/work",
    keywords: [
      ...new Set([
        "Freeman",
        "Project",
        project.title,
        project.category,
        project.role,
        ...project.stacks,
      ]),
    ].sort(),
    paragraphs: nonEmpty([
      `Project: ${project.title}. Freeman built this ${project.category} project.`,
      `Freeman's role: ${project.role}.`,
      `Summary: ${project.summary}`,
      `Outcome: ${project.outcome}`,
      `Implementation detail: ${project.detail}`,
      project.collaboration ? `Collaboration: ${project.collaboration}` : null,
      project.future ? `Future direction: ${project.future}` : null,
      project.positioning ? `Positioning: ${project.positioning}` : null,
      project.stacks.length ? `Technologies: ${[...project.stacks].sort().join(", ")}` : null,
    ]),
  };
}

function mapExperience(experience: Experience): IndexDocument {
  return {
    sourceType: "experiences",
    sourceId: experience.id,
    title: `${experience.title} at ${experience.company}`,
    category: experience.category,
    url: "/about",
    keywords: ["Experience", experience.category, experience.company, experience.title].sort(),
    paragraphs: nonEmpty([
      `Experience: Freeman worked as ${experience.title} at ${experience.company}.`,
      `Dates: ${experience.dates}`,
      experience.location ? `Location: ${experience.location}` : null,
      `Focus: ${experience.focus}`,
    ]),
  };
}

function mapService(service: Service): IndexDocument {
  return {
    sourceType: "services",
    sourceId: service.id,
    title: service.title,
    category: "Service",
    url: "/",
    keywords: ["Freeman", "Service", service.title].sort(),
    paragraphs: nonEmpty([
      `Service: Freeman offers ${service.title}.`,
      service.lead,
      service.description,
      service.assistantPrompt ? `Example request: ${service.assistantPrompt}` : null,
    ]),
  };
}

function mapPrinciple(principle: Principle): IndexDocument {
  const url = principle.section === "home" ? "/" : principle.section === "about" ? "/about" : null;

  if (!url) {
    throw new Error(`Unsupported principle section: ${principle.section}`);
  }

  return {
    sourceType: "principles",
    sourceId: principle.id,
    title: principle.title,
    category: "Principle",
    url,
    keywords: ["Freeman", "Principle", principle.title].sort(),
    paragraphs: [`Principle: Freeman values ${principle.title}.`, principle.body],
  };
}

export function mapSourceDocument(source: SourceRecord): IndexDocument {
  switch (source.sourceType) {
    case "content_blocks":
      return mapContentBlockDocument(source.record);
    case "projects":
      return mapProject(source.record);
    case "services":
      return mapService(source.record);
    case "principles":
      return mapPrinciple(source.record);
    case "experiences":
      return mapExperience(source.record);
  }
}
