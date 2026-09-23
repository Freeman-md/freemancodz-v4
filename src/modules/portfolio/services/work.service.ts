import "server-only";
import type { IContentBlockRepository } from "../interfaces/content-block.repository.interface";
import type { IProfileRepository } from "../interfaces/profile.repository.interface";
import type { IProjectRepository } from "../interfaces/project.repository.interface";
import type { IWorkService } from "../interfaces/work.service.interface";
export class WorkService implements IWorkService {
  constructor(
    private readonly profiles: IProfileRepository,
    private readonly contentBlocks: IContentBlockRepository,
    private readonly projects: IProjectRepository,
  ) {}

  async getPageData() {
    const [profile, blocks, projects] = await Promise.all([
      this.profiles.findSingleton(),
      this.contentBlocks.findPageTree("/work"),
      this.projects.findAll(),
    ]);

    return { profile, contentBlocks: blocks, projects };
  }
}
