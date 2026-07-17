import "server-only";
import { prisma } from "@/lib/prisma";

export function findExperiences() {
  return prisma.experience.findMany({ orderBy: { position: "asc" } });
}
