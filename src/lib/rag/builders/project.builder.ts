import type { Project } from "@/generated/prisma/client";
import { document, sentences } from "./shared";

export function buildProjectDocuments(project: Project) {
  return [document({
    sourceType: "projects", sourceId: project.id, title: project.title, category: project.category, url: "/work",
    content: sentences([
      "Portfolio project.", `Summary: ${project.summary}`, `Role: ${project.role}`, `Outcome: ${project.outcome}`,
      `Detail: ${project.detail}`, project.future ? `Future direction: ${project.future}` : null,
      project.collaboration ? `Collaboration: ${project.collaboration}` : null,
      project.positioning ? `Positioning: ${project.positioning}` : null,
      project.stacks.length ? `Stacks: ${project.stacks.join(", ")}.` : null,
    ]),
    keywords: [project.title, project.category, project.role, ...project.stacks],
  })];
}
