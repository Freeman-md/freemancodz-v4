import "server-only";
import type { ContentPage, ContentSection } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function findRequiredContentBlockByKey(key: string) {
  const block = await prisma.contentBlock.findUnique({ where: { key } });
  if (!block) {
    throw new Error(`Required content block not found: ${key}`);
  }
  return block;
}

export function findContentBlocksBySection(page: ContentPage, section: ContentSection) {
  return prisma.contentBlock.findMany({
    where: { page, section },
    orderBy: { position: "asc" },
  });
}
