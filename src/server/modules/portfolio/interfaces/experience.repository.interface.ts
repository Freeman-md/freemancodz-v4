import type { ExperienceWithIcons } from "../models/portfolio-records";
import type {
  OrderedRelationInput,
  UpsertExperienceInput,
} from "@/contracts/portfolio-admin.contract";
export interface IExperienceRepository {
  findAll(): Promise<ExperienceWithIcons[]>;
}
export interface IExperienceAdministrationRepository extends IExperienceRepository {
  create(input: UpsertExperienceInput): Promise<string>;
  update(id: string, input: UpsertExperienceInput): Promise<void>;
  replaceIcons(id: string, icons: OrderedRelationInput[]): Promise<void>;
  delete(id: string): Promise<void>;
}
