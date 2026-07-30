import type { Project } from "@/generated/prisma/client";
import type { SearchDocument } from "@/server/modules/search-index/models/search-index";

export function buildProjectDocuments(project: Project): SearchDocument[] {
  const optionalSections = [
    project.future ? `Future direction: ${project.future}` : null,
    project.collaboration ? `Collaboration: ${project.collaboration}` : null,
    project.positioning ? `Positioning: ${project.positioning}` : null,
  ].filter((section): section is string => section !== null);

  const content = [
    `Summary: ${project.summary}`,
    `Role: ${project.role}`,
    `Outcome: ${project.outcome}`,
    `Details: ${project.detail}`,
    ...optionalSections,
    project.stacks.length > 0
      ? `Technologies: ${[...project.stacks].sort().join(", ")}`
      : null,
  ]
    .filter((section): section is string => section !== null)
    .join("\n\n");

  return [
    {
      sourceType: "projects",
      sourceId: project.id,
      documentIndex: 0,
      title: project.title,
      category: project.category,
      url: "/work",
      content,
      keywords: [...new Set([project.category, project.role, ...project.stacks])].sort(),
    },
  ];
}