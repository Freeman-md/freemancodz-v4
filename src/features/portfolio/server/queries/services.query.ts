import "server-only";
import { prisma } from "@/server/infrastructure/database/prisma";

export function findServices() {
  return prisma.service.findMany({ orderBy: { position: "asc" } });
}
