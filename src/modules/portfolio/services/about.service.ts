import "server-only";
import type { IAboutService } from "../interfaces/about.service.interface";
import type { IContentBlockRepository } from "../interfaces/content-block.repository.interface";
import type { IExperienceRepository } from "../interfaces/experience.repository.interface";
import type { IProfileRepository } from "../interfaces/profile.repository.interface";
export class AboutService implements IAboutService {
  constructor(
    private readonly profiles: IProfileRepository,
    private readonly contentBlocks: IContentBlockRepository,
    private readonly experiences: IExperienceRepository,
  ) {}

  async getPageData() {
    const [profile, blocks, experiences] = await Promise.all([
      this.profiles.findSingleton(),
      this.contentBlocks.findPageTree("/about"),
      this.experiences.findAll(),
    ]);

    return { profile, contentBlocks: blocks, experiences };
  }
}
