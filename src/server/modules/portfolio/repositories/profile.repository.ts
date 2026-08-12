import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IProfileRepository } from "../interfaces/profile.repository.interface";

export class ProfileRepository implements IProfileRepository {
  constructor(private readonly database: PrismaClient) {}

  async findSingleton() {
    const profile = await this.database.profile.findUnique({
      where: { id: "global" },
      include: {
        iconCollections: {
          orderBy: [{ collection: "asc" }, { order: "asc" }],
          include: { iconBlock: true },
        },
      },
    });

    if (!profile) {
      throw new Error("Portfolio profile is not initialised.");
    }

    return profile;
  }
}
