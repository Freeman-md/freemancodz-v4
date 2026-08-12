import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IProfileAdministrationRepository } from "../interfaces/profile.repository.interface";
import type { ProfileCollectionOrderInput, UpdateProfileInput } from "../models/portfolio-administration";

export class ProfileRepository implements IProfileAdministrationRepository {
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

  async updateSingleton(input: UpdateProfileInput) {
    await this.database.profile.update({ where: { id: "global" }, data: input });
  }

  async updateCoverImage(source: string) {
    await this.database.profile.update({ where: { id: "global" }, data: { coverImage: source } });
  }

  async replaceCollection({ collection, items }: ProfileCollectionOrderInput) {
    await this.database.$transaction(async (transaction) => {
      await transaction.profileIconBlock.deleteMany({ where: { profileId: "global", collection } });
      if (items.length > 0) {
        await transaction.profileIconBlock.createMany({
          data: items.map(({ id, order }) => ({
            profileId: "global",
            collection,
            iconBlockId: id,
            order,
          })),
        });
      }
    });
  }
}
