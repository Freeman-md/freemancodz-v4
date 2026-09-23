import "server-only";
import type { IProfileRepository } from "../interfaces/profile.repository.interface";
import type { IProfileService } from "../interfaces/profile.service.interface";

export class ProfileService implements IProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async getPublicProfile() {
    const profile = await this.profileRepository.findSingleton();

    return { linkedInUrl: profile.linkedInUrl, githubUrl: profile.githubUrl, coverImage: profile.coverImage };
  }
}
