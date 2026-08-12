import type { MediaBlockWithBase } from "../models/portfolio-records";
export interface IMediaBlockRepository {
  findById(id: string): Promise<MediaBlockWithBase | null>;
}
