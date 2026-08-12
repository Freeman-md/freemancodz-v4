import type { ExperienceWithIcons } from "../models/portfolio-records";
export interface IExperienceRepository {
  findAll(): Promise<ExperienceWithIcons[]>;
}
