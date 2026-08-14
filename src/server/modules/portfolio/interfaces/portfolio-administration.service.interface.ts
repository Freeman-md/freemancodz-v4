import type {
  OrderedRelationInput,
  UpdateProfileInput,
  UpdateProfileCollectionInput,
  UpsertActionBlockInput,
  UpsertExperienceInput,
  UpsertIconBlockInput,
  UpsertMediaBlockInput,
  UpsertProjectInput,
} from "@/contracts/portfolio-admin.contract";
import type {
  ProjectUpdateResult,
  UpdateContentBlockInput,
} from "../models/portfolio-administration";
import type { PortfolioPagePath } from "./content-block.repository.interface";
import type {
  ActionBlockWithBase,
  ContentBlockNode,
  ExperienceWithIcons,
  MediaBlockWithBase,
  ProfileWithCollections,
  ProjectWithCover,
} from "../models/portfolio-records";
import type { IconBlock } from "@/generated/prisma/client";

export interface IPortfolioAdministrationService {
  getProfile(): Promise<ProfileWithCollections>;
  getPageContent(page: PortfolioPagePath): Promise<ContentBlockNode[]>;
  getIconBlocks(): Promise<IconBlock[]>;
  getActionBlocks(): Promise<ActionBlockWithBase[]>;
  getMediaBlocks(): Promise<MediaBlockWithBase[]>;
  getProjects(): Promise<ProjectWithCover[]>;
  getExperiences(): Promise<ExperienceWithIcons[]>;
  updateProfile(input: UpdateProfileInput): Promise<void>;
  updateProfileCollection(input: UpdateProfileCollectionInput): Promise<void>;
  updateContentBlock(id: string, input: UpdateContentBlockInput): Promise<void>;
  updateContentBlockChildren(id: string, children: OrderedRelationInput[]): Promise<void>;
  updateContentBlockIcons(id: string, icons: OrderedRelationInput[]): Promise<void>;
  updateContentBlockMedia(id: string, media: OrderedRelationInput[]): Promise<void>;
  updateContentBlockActions(id: string, actions: OrderedRelationInput[]): Promise<void>;
  createIconBlock(input: UpsertIconBlockInput): Promise<string>;
  updateIconBlock(id: string, input: UpsertIconBlockInput): Promise<void>;
  deleteIconBlock(id: string): Promise<void>;
  createActionBlock(input: UpsertActionBlockInput): Promise<string>;
  updateActionBlock(id: string, input: UpsertActionBlockInput): Promise<void>;
  deleteActionBlock(id: string): Promise<void>;
  createMediaBlock(input: UpsertMediaBlockInput): Promise<string>;
  updateMediaBlock(id: string, input: UpsertMediaBlockInput): Promise<void>;
  deleteMediaBlock(id: string): Promise<void>;
  createProject(input: UpsertProjectInput): Promise<string>;
  updateProject(id: string, input: UpsertProjectInput): Promise<ProjectUpdateResult>;
  deleteProject(id: string): Promise<void>;
  createExperience(input: UpsertExperienceInput): Promise<string>;
  updateExperience(id: string, input: UpsertExperienceInput): Promise<void>;
  updateExperienceIcons(id: string, icons: OrderedRelationInput[]): Promise<void>;
  deleteExperience(id: string): Promise<void>;
}
