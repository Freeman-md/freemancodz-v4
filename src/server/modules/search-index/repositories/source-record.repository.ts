import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  ISourceRecordRepository,
  SourceRecord,
} from "../interfaces/source-record.repository.interface";
import type { IndexableSourceType } from "../mappers/source-document.mapper";

export class SourceRecordRepository implements ISourceRecordRepository {
  constructor(private readonly database: PrismaClient) {}

  async findById(
    _sourceType: IndexableSourceType,
    _sourceId: string,
  ): Promise<SourceRecord | null> {
    return this.indexingUnavailable();
  }

  async findAll(): Promise<SourceRecord[]> {
    return this.indexingUnavailable();
  }

  private indexingUnavailable(): never {
    void this.database;

    throw new Error(
      "Portfolio source indexing is unavailable until the deferred search-index milestone.",
    );
  }
}
