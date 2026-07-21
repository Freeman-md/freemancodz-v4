import "server-only";
import { prisma } from "@/lib/db";

export function findExperiences() {
  return prisma.experience.findMany({ orderBy: { position: "asc" } });
}
