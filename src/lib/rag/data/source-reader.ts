import "server-only";
import { prisma } from "@/lib/prisma";
import type { ContentBlock, Experience, Principle, Project, Service } from "@/generated/prisma/client";
import type { IndexableSourceType } from "../types";

export type IndexableRecord = ContentBlock | Experience | Principle | Project | Service;

export async function loadSourceRecord(sourceType: IndexableSourceType, sourceId: string): Promise<IndexableRecord | null> {
  switch (sourceType) {
    case "content_blocks": return prisma.contentBlock.findUnique({ where: { id: sourceId } });
    case "projects": return prisma.project.findUnique({ where: { id: sourceId } });
    case "services": return prisma.service.findUnique({ where: { id: sourceId } });
    case "principles": return prisma.principle.findUnique({ where: { id: sourceId } });
    case "experiences": return prisma.experience.findUnique({ where: { id: sourceId } });
  }
}

export async function loadAllSourceRecords() {
  const [contentBlocks, projects, services, principles, experiences] = await Promise.all([
    prisma.contentBlock.findMany(), prisma.project.findMany(), prisma.service.findMany(), prisma.principle.findMany(), prisma.experience.findMany(),
  ]);
  return { content_blocks: contentBlocks, projects, services, principles, experiences } as const;
}
