import "server-only";
import { prisma } from "@/lib/db";

export function findServices() {
  return prisma.service.findMany({ orderBy: { position: "asc" } });
}
