import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IMediaBlockRepository } from "../interfaces/media-block.repository.interface";
export class MediaBlockRepository implements IMediaBlockRepository {
  constructor(private readonly database: PrismaClient) {}

  findById(id: string) {
    return this.database.mediaBlock.findUnique({ where: { id }, include: { iconBlock: true } });
  }
}
