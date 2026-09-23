import "server-only";
import type { IContentBlockRepository } from "../interfaces/content-block.repository.interface";
import type { IHomeService } from "../interfaces/home.service.interface";
import type { IProfileRepository } from "../interfaces/profile.repository.interface";
import type { IProjectRepository } from "../interfaces/project.repository.interface";

const HOME_PROJECTS = ["pay4me-withradius", "portfolio-assistant", "email-pa"];

export class HomeService implements IHomeService {
  constructor(
    private readonly profiles: IProfileRepository,
    private readonly contentBlocks: IContentBlockRepository,
    private readonly projects: IProjectRepository,
  ) {}

  async getPageData() {
    const [profile, blocks, projects] = await Promise.all([
      this.profiles.findSingleton(),
      this.contentBlocks.findPageTree("/"),
      this.projects.findBySlugs(HOME_PROJECTS),
    ]);

    return { profile, contentBlocks: blocks, projects };
  }
}
