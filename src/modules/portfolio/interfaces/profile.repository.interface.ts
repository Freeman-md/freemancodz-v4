import type { ProfileWithCollections } from "../models/portfolio-records";
import type {
  UpdateProfileInput,
  UpdateProfileCollectionInput,
} from "@/contracts/portfolio-admin.contract";
export interface IProfileRepository {
  findSingleton(): Promise<ProfileWithCollections>;
}
export interface IProfileAdministrationRepository extends IProfileRepository {
  updateSingleton(input: UpdateProfileInput): Promise<void>;
  updateCoverImage(source: string): Promise<void>;
  replaceCollection(input: UpdateProfileCollectionInput): Promise<void>;
}
