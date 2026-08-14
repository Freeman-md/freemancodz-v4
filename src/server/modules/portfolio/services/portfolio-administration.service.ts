import "server-only";
import type {
  OrderedRelationInput,
  UpdateProfileCollectionInput,
  UpdateProfileInput,
  UpsertActionBlockInput,
  UpsertExperienceInput,
  UpsertIconBlockInput,
  UpsertMediaBlockInput,
  UpsertProjectInput,
} from "@/contracts/portfolio-admin.contract";
import { requiredPortfolioProjectSlugs } from "@/contracts/portfolio-presentation.contract";
import type { IActionBlockAdministrationRepository } from "../interfaces/action-block.repository.interface";
import type { IContentBlockAdministrationRepository } from "../interfaces/content-block.repository.interface";
import type { IExperienceAdministrationRepository } from "../interfaces/experience.repository.interface";
import type { IIconBlockAdministrationRepository } from "../interfaces/icon-block.repository.interface";
import type { IMediaBlockAdministrationRepository } from "../interfaces/media-block.repository.interface";
import type { IPortfolioAdministrationService } from "../interfaces/portfolio-administration.service.interface";
import type { IProfileAdministrationRepository } from "../interfaces/profile.repository.interface";
import type { IProjectAdministrationRepository } from "../interfaces/project.repository.interface";
import type {
  ProjectUpdateResult,
  UpdateContentBlockInput,
} from "../models/portfolio-administration";

const PROTECTED_PROJECT_SLUGS = new Set<string>(requiredPortfolioProjectSlugs);

export class PortfolioAdministrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioAdministrationError";
  }
}

export class PortfolioAdministrationService implements IPortfolioAdministrationService {
  constructor(
    private readonly profiles: IProfileAdministrationRepository,
    private readonly contentBlocks: IContentBlockAdministrationRepository,
    private readonly icons: IIconBlockAdministrationRepository,
    private readonly actions: IActionBlockAdministrationRepository,
    private readonly media: IMediaBlockAdministrationRepository,
    private readonly projects: IProjectAdministrationRepository,
    private readonly experiences: IExperienceAdministrationRepository,
  ) {}

  getProfile() {
    return this.profiles.findSingleton();
  }

  getPageContent(page: "/" | "/work" | "/about" | "/audit") {
    return this.contentBlocks.findPageTree(page);
  }

  getIconBlocks() {
    return this.icons.findAll();
  }

  getActionBlocks() {
    return this.actions.findAll();
  }

  getMediaBlocks() {
    return this.media.findAll();
  }

  getProjects() {
    return this.projects.findAll();
  }

  getExperiences() {
    return this.experiences.findAll();
  }

  async updateProfile(input: UpdateProfileInput) {
    await this.profiles.updateSingleton(input);
  }

  async updateProfileCollection(input: UpdateProfileCollectionInput) {
    await this.profiles.replaceCollection(input);
  }

  async updateContentBlock(id: string, input: UpdateContentBlockInput) {
    await this.contentBlocks.update(id, input);
  }

  async updateContentBlockChildren(id: string, children: OrderedRelationInput[]) {
    await this.contentBlocks.replaceChildren(id, children);
  }

  async updateContentBlockIcons(id: string, icons: OrderedRelationInput[]) {
    await this.contentBlocks.replaceIcons(id, icons);
  }

  async updateContentBlockMedia(id: string, media: OrderedRelationInput[]) {
    await this.contentBlocks.replaceMedia(id, media);
  }

  async updateContentBlockActions(id: string, actions: OrderedRelationInput[]) {
    await this.contentBlocks.replaceActions(id, actions);
  }

  createIconBlock(input: UpsertIconBlockInput) {
    return this.icons.create(input);
  }

  async updateIconBlock(id: string, input: UpsertIconBlockInput) {
    await this.icons.update(id, input);
  }

  async deleteIconBlock(id: string) {
    await this.assertUnreferenced(id);
    await this.icons.delete(id);
  }

  createActionBlock(input: UpsertActionBlockInput) {
    return this.actions.create(input);
  }

  async updateActionBlock(id: string, input: UpsertActionBlockInput) {
    await this.actions.update(id, input);
  }

  async deleteActionBlock(id: string) {
    await this.assertUnreferenced(id);
    await this.actions.delete(id);
  }

  createMediaBlock(input: UpsertMediaBlockInput) {
    return this.media.create(input);
  }

  async updateMediaBlock(id: string, input: UpsertMediaBlockInput) {
    await this.media.update(id, input);
  }

  async deleteMediaBlock(id: string) {
    await this.assertUnreferenced(id);
    await this.media.delete(id);
  }

  createProject(input: UpsertProjectInput) {
    return this.projects.create(input);
  }

  async updateProject(id: string, input: UpsertProjectInput): Promise<ProjectUpdateResult> {
    const existing = await this.projects.findById(id);

    if (!existing) {
      throw new PortfolioAdministrationError("Project was not found.");
    }

    if (input.slug !== existing.slug) {
      throw new PortfolioAdministrationError("Project slugs are immutable after creation.");
    }

    await this.projects.update(id, input);

    return {
      slug: existing.slug,
      collectionChanged: input.order !== existing.order || input.featured !== existing.featured,
    };
  }

  async deleteProject(id: string) {
    const projects = await this.projects.findAll();

    const project = projects.find((candidate) => candidate.id === id);

    if (!project) {
      throw new PortfolioAdministrationError("Project was not found.");
    }

    if (PROTECTED_PROJECT_SLUGS.has(project.slug)) {
      throw new PortfolioAdministrationError(
        "This curated Project is required by a public portfolio composition.",
      );
    }

    await this.projects.delete(id);
  }

  createExperience(input: UpsertExperienceInput) {
    return this.experiences.create(input);
  }

  async updateExperience(id: string, input: UpsertExperienceInput) {
    await this.experiences.update(id, input);
  }

  async updateExperienceIcons(id: string, icons: OrderedRelationInput[]) {
    await this.experiences.replaceIcons(id, icons);
  }

  async deleteExperience(id: string) {
    await this.experiences.delete(id);
  }

  private async assertUnreferenced(id: string) {
    const references = await this.icons.countReferences(id);

    if (Object.values(references).some((count) => count > 0)) {
      throw new PortfolioAdministrationError(
        "Reusable content cannot be deleted while it is referenced.",
      );
    }
  }
}
