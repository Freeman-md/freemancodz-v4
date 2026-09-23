import type { MediaBlockWithBase } from "../models/portfolio-records";
import type { MediaMetadataInput } from "@/contracts/portfolio-admin.contract";
export interface IMediaBlockRepository {
  findById(id: string): Promise<MediaBlockWithBase | null>;
  findAll(): Promise<MediaBlockWithBase[]>;
}
export interface IMediaBlockAdministrationRepository extends IMediaBlockRepository {
  countSourceReferences(source: string): Promise<number>;
  create(input: MediaMetadataInput & { type: "IMAGE" | "VIDEO"; source: string }): Promise<string>;
  update(id: string, input: MediaMetadataInput): Promise<void>;
  updateManagedMedia(id: string, source: string, type: "IMAGE" | "VIDEO"): Promise<void>;
  delete(id: string): Promise<void>;
}
