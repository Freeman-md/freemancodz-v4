import "server-only";

import type {
  ContentBlockNode,
  ExperienceWithIcons,
  ProfileWithCollections,
  ProjectWithCover,
} from "./types";

const CURATED_PROJECTS = ["pay4me-withradius", "portfolio-assistant", "email-pa"];

type PortfolioReaders = {
  profiles: { findSingleton(): Promise<ProfileWithCollections> };
  contentBlocks: { findPageTree(page: "/" | "/work" | "/about" | "/audit"): Promise<ContentBlockNode[]> };
  projects: {
    findAll(): Promise<ProjectWithCover[]>;
    findBySlugs(slugs: string[]): Promise<ProjectWithCover[]>;
  };
  experiences: { findAll(): Promise<ExperienceWithIcons[]> };
};

export class PortfolioService {
  constructor(
    private readonly profiles: PortfolioReaders["profiles"],
    private readonly contentBlocks: PortfolioReaders["contentBlocks"],
    private readonly projects: PortfolioReaders["projects"],
    private readonly experiences: PortfolioReaders["experiences"],
  ) {}

  async getHomePageData() {
    const [profile, contentBlocks, projects] = await Promise.all([
      this.profiles.findSingleton(),
      this.contentBlocks.findPageTree("/"),
      this.projects.findBySlugs(CURATED_PROJECTS),
    ]);

    return { profile, contentBlocks, projects };
  }

  async getWorkPageData() {
    const [profile, contentBlocks, projects] = await Promise.all([
      this.profiles.findSingleton(),
      this.contentBlocks.findPageTree("/work"),
      this.projects.findAll(),
    ]);

    return { profile, contentBlocks, projects };
  }

  async getAboutPageData() {
    const [profile, contentBlocks, experiences] = await Promise.all([
      this.profiles.findSingleton(),
      this.contentBlocks.findPageTree("/about"),
      this.experiences.findAll(),
    ]);

    return { profile, contentBlocks, experiences };
  }

  async getAuditPageData() {
    const [contentBlocks, projects] = await Promise.all([
      this.contentBlocks.findPageTree("/audit"),
      this.projects.findBySlugs(CURATED_PROJECTS),
    ]);

    return { contentBlocks, projects };
  }

  async getPublicProfile() {
    const profile = await this.profiles.findSingleton();

    return {
      linkedInUrl: profile.linkedInUrl,
      githubUrl: profile.githubUrl,
      coverImage: profile.coverImage,
    };
  }
}
