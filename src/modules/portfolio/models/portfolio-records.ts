import type { Prisma } from "@/generated/prisma/client";

export type ProfileWithCollections = Prisma.ProfileGetPayload<{
  include: { iconCollections: { include: { iconBlock: true } } };
}>;

export type ContentBlockNode = Prisma.ContentBlockGetPayload<{
  include: {
    iconBlocks: { include: { iconBlock: true } };
    mediaBlocks: { include: { mediaBlock: { include: { iconBlock: true } } } };
    actionBlocks: { include: { actionBlock: { include: { iconBlock: true } } } };
  };
}> & { children: Array<{ order: number; child: ContentBlockNode }> };

export type ProjectWithCover = Prisma.ProjectGetPayload<{
  include: { cover: { include: { iconBlock: true } } };
}>;

export type ExperienceWithIcons = Prisma.ExperienceGetPayload<{
  include: { iconBlocks: { include: { iconBlock: true } } };
}>;

export type MediaBlockWithBase = Prisma.MediaBlockGetPayload<{ include: { iconBlock: true } }>;
export type ActionBlockWithBase = Prisma.ActionBlockGetPayload<{ include: { iconBlock: true } }>;
