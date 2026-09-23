import type { ProfileWithCollections } from "../models/portfolio-records";

export type PublicProfile = Pick<ProfileWithCollections, "linkedInUrl" | "githubUrl" | "coverImage">;

export interface IProfileService {
  getPublicProfile(): Promise<PublicProfile>;
}
