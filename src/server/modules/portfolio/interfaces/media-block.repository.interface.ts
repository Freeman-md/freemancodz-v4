import type { MediaBlockWithBase } from "../models/portfolio-records";
import type { UpsertMediaBlockInput } from "../models/portfolio-administration";
export interface IMediaBlockRepository {
  findById(id: string): Promise<MediaBlockWithBase | null>;
  findAll(): Promise<MediaBlockWithBase[]>;
}
export interface IMediaBlockAdministrationRepository extends IMediaBlockRepository {
  countSourceReferences(source: string): Promise<number>;
  create(input: UpsertMediaBlockInput): Promise<string>;
  update(id: string, input: UpsertMediaBlockInput): Promise<void>;
  updateSource(id: string, source: string): Promise<void>;
  delete(id: string): Promise<void>;
}
