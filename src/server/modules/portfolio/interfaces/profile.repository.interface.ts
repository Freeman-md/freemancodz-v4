import type { ProfileWithCollections } from "../models/portfolio-records";
export interface IProfileRepository {
  findSingleton(): Promise<ProfileWithCollections>;
}
