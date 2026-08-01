import type {
  ContentBlock,
  Experience,
  Principle,
  Project,
  Service,
} from "@/generated/prisma/client";
import type { IndexableSourceType } from "../mappers/source-document.mapper";
export type SourceRecord =
  | { sourceType: "content_blocks"; record: ContentBlock }
  | { sourceType: "projects"; record: Project }
  | { sourceType: "services"; record: Service }
  | { sourceType: "principles"; record: Principle }
  | { sourceType: "experiences"; record: Experience };
export interface ISourceRecordRepository {
  findById(sourceType: IndexableSourceType, sourceId: string): Promise<SourceRecord | null>;
  findAll(): Promise<SourceRecord[]>;
}
