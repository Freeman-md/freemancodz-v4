import type { ProfileWithCollections } from "../models/portfolio-records";
import type {
  ProfileCollectionOrderInput,
  UpdateProfileInput,
} from "../models/portfolio-administration";
export interface IProfileRepository {
  findSingleton(): Promise<ProfileWithCollections>;
}
export interface IProfileAdministrationRepository extends IProfileRepository {
  updateSingleton(input: UpdateProfileInput): Promise<void>;
  updateCoverImage(source: string): Promise<void>;
  replaceCollection(input: ProfileCollectionOrderInput): Promise<void>;
}
