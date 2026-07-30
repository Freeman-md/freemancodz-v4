import "server-only";
import { prisma } from "@/server/infrastructure/database/prisma";

export function findProjects() {
  return prisma.project.findMany({ orderBy: { position: "asc" } });
}

export function findFeaturedProjects() {
  return prisma.project.findMany({ where: { featured: true }, orderBy: { position: "asc" } });
}
