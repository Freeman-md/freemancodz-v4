import type { UpdateContentBlockMutation } from "@/contracts/portfolio-admin.contract";

export type UpdateContentBlockInput = Omit<UpdateContentBlockMutation, "id">;

export type ReusableBlockReferences = {
  contentBlocks: number;
  profileCollections: number;
  experiences: number;
  projectCovers: number;
};

export type ProjectUpdateResult = {
  slug: string;
  collectionChanged: boolean;
};
