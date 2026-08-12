import type { SearchIndexSourceType } from "@/contracts/search-index-source.contract";

export type SourceRecord = {
  sourceType: SearchIndexSourceType;
  record: { id: string };
};

export interface ISourceRecordRepository {
  findById(sourceType: SearchIndexSourceType, sourceId: string): Promise<SourceRecord | null>;
  findAll(): Promise<SourceRecord[]>;
}
