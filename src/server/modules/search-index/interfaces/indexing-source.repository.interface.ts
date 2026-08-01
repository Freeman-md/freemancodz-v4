import type { IndexableSource, IndexableSourceType } from "../models/search-index";
export interface IIndexingSourceRepository {
  findById(sourceType: IndexableSourceType, sourceId: string): Promise<IndexableSource | null>;
  findAll(): Promise<IndexableSource[]>;
}
