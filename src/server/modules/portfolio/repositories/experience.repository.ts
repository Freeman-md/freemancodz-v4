import "server-only";
import { prisma } from "@/server/infrastructure/database/prisma";

export function findExperiences() {
  return prisma.experience.findMany({ orderBy: { position: "asc" } });
}
