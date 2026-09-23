import type { Prisma } from "@/generated/prisma/client";
import type {
  MediaMetadataInput,
  OrderedRelationInput,
  UpdateProfileCollectionInput,
  UpdateProfileInput,
  UpsertActionBlockInput,
  UpsertExperienceInput,
  UpsertIconBlockInput,
  UpsertProjectInput,
} from "@/contracts/portfolio-admin.contract";

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

export type HomePageData = {
  profile: ProfileWithCollections;
  contentBlocks: ContentBlockNode[];
  projects: ProjectWithCover[];
};

export type WorkPageData = HomePageData;

export type AboutPageData = {
  profile: ProfileWithCollections;
  contentBlocks: ContentBlockNode[];
  experiences: ExperienceWithIcons[];
};

export type AuditPageData = {
  contentBlocks: ContentBlockNode[];
  projects: ProjectWithCover[];
};

export type PortfolioPagePath = "/" | "/work" | "/about" | "/audit";

export type PublicProfile = Pick<ProfileWithCollections, "linkedInUrl" | "githubUrl" | "coverImage">;

export type PortfolioMediaUpload = { objectPath: string; body: Uint8Array; contentType: string };

export type ReplacePortfolioMediaInput = {
  owner: import("@/contracts/portfolio-admin.contract").MediaOwnerInput;
  body: Uint8Array;
  contentType: string;
  fileExtension: string;
};

export type ReplacePortfolioMediaResult = {
  source: string;
  cleanupWarning: boolean;
  projectSlug?: string;
};

export type CreatePortfolioMediaInput = Omit<ReplacePortfolioMediaInput, "owner"> & {
  metadata: import("@/contracts/portfolio-admin.contract").MediaMetadataInput;
};

export type CreatePortfolioMediaResult = ReplacePortfolioMediaResult & { id: string };

export type PortfolioMedia = {
  replaceMedia(input: ReplacePortfolioMediaInput): Promise<ReplacePortfolioMediaResult>;
  createMediaBlock(input: CreatePortfolioMediaInput): Promise<CreatePortfolioMediaResult>;
};

export type UpdateContentBlockInput = Omit<
  import("@/contracts/portfolio-admin.contract").UpdateContentBlockMutation,
  "id"
>;

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

export type ProfileStore = {
  findSingleton(): Promise<ProfileWithCollections>;
  updateSingleton(input: UpdateProfileInput): Promise<void>;
  updateCoverImage(source: string): Promise<void>;
  replaceCollection(input: UpdateProfileCollectionInput): Promise<void>;
};

export type ContentBlockStore = {
  findPageTree(page: PortfolioPagePath): Promise<ContentBlockNode[]>;
  update(id: string, input: UpdateContentBlockInput): Promise<void>;
  replaceChildren(id: string, children: OrderedRelationInput[]): Promise<void>;
  replaceIcons(id: string, icons: OrderedRelationInput[]): Promise<void>;
  replaceMedia(id: string, media: OrderedRelationInput[]): Promise<void>;
  replaceActions(id: string, actions: OrderedRelationInput[]): Promise<void>;
};

export type ProjectStore = {
  findAll(): Promise<ProjectWithCover[]>;
  findBySlug(slug: string): Promise<ProjectWithCover | null>;
  findBySlugs(slugs: string[]): Promise<ProjectWithCover[]>;
  findFeatured(): Promise<ProjectWithCover[]>;
  findById(id: string): Promise<ProjectWithCover | null>;
  create(input: UpsertProjectInput): Promise<string>;
  update(id: string, input: UpsertProjectInput): Promise<void>;
  delete(id: string): Promise<void>;
};

export type ExperienceStore = {
  findAll(): Promise<ExperienceWithIcons[]>;
  create(input: UpsertExperienceInput): Promise<string>;
  update(id: string, input: UpsertExperienceInput): Promise<void>;
  replaceIcons(id: string, icons: OrderedRelationInput[]): Promise<void>;
  delete(id: string): Promise<void>;
};

export type IconBlockStore = {
  findById(id: string): Promise<import("@/generated/prisma/client").IconBlock | null>;
  findAll(): Promise<import("@/generated/prisma/client").IconBlock[]>;
  create(input: UpsertIconBlockInput): Promise<string>;
  update(id: string, input: UpsertIconBlockInput): Promise<void>;
  delete(id: string): Promise<void>;
  countReferences(id: string): Promise<ReusableBlockReferences>;
};

export type ActionBlockStore = {
  findById(id: string): Promise<ActionBlockWithBase | null>;
  findAll(): Promise<ActionBlockWithBase[]>;
  create(input: UpsertActionBlockInput): Promise<string>;
  update(id: string, input: UpsertActionBlockInput): Promise<void>;
  delete(id: string): Promise<void>;
};

export type MediaBlockStore = {
  findById(id: string): Promise<MediaBlockWithBase | null>;
  findAll(): Promise<MediaBlockWithBase[]>;
  countSourceReferences(source: string): Promise<number>;
  create(input: MediaMetadataInput & { type: "IMAGE" | "VIDEO"; source: string }): Promise<string>;
  update(id: string, input: MediaMetadataInput): Promise<void>;
  updateManagedMedia(id: string, source: string, type: "IMAGE" | "VIDEO"): Promise<void>;
  delete(id: string): Promise<void>;
};

export type PortfolioStorage = {
  ensurePublicBucket(): Promise<void>;
  getPublicUrl(objectPath: string): string;
};

export type PortfolioMediaStorage = PortfolioStorage & {
  upload(asset: PortfolioMediaUpload): Promise<string>;
  removeObject(objectPath: string): Promise<void>;
  getObjectPath(publicUrl: string): string | null;
};
