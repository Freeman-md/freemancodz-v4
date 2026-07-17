import "server-only";
import { prisma } from "@/lib/prisma";

export function findServices() {
  return prisma.service.findMany({ orderBy: { position: "asc" } });
}
