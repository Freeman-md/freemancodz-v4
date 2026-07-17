import "server-only";
import { prisma } from "@/lib/prisma";

export function findPrinciplesBySection(section: string) {
  return prisma.principle.findMany({ where: { section }, orderBy: { position: "asc" } });
}
