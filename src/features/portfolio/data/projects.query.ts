import "server-only";
import { prisma } from "@/lib/prisma";

export function findProjects() {
  return prisma.project.findMany({ orderBy: { position: "asc" } });
}

export function findFeaturedProjects() {
  return prisma.project.findMany({ where: { featured: true }, orderBy: { position: "asc" } });
}
