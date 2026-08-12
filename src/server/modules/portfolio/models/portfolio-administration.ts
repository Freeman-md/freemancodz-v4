import type { ProfileIconCollection } from "@/generated/prisma/client";
export type {
  UpdateProfileInput,
  UpsertActionBlockInput,
  UpsertExperienceInput,
  UpsertIconBlockInput,
  UpsertMediaBlockInput,
  UpsertProjectInput,
} from "@/contracts/portfolio-admin.contract";

export type UpdateContentBlockInput = {
  eyebrow: string | null;
  title: string | null;
  copy: string | null;
  order: number | null;
};

export type OrderedRelationInput = { id: string; order: number };
export type ProfileCollectionOrderInput = {
  collection: ProfileIconCollection;
  items: OrderedRelationInput[];
};

export type ReusableBlockReferences = {
  contentBlocks: number;
  profileCollections: number;
  experiences: number;
  projectCovers: number;
};

export type MediaOwner =
  | { type: "profile" }
  | { type: "media-block"; id: string }
  | { type: "project-cover"; id: string };

export type ProjectUpdateResult = {
  slug: string;
  collectionChanged: boolean;
};
