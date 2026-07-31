import { SearchIndexSourceInputSchema, type SearchIndexSourceInput } from "@/contracts/search-index-source.contract";
export const indexSourceInputSchema = SearchIndexSourceInputSchema;
export type IndexSourceInput = SearchIndexSourceInput;

export function parseIndexSourceInput(sourceType: unknown, sourceId: unknown): IndexSourceInput {
  return indexSourceInputSchema.parse({ sourceType, sourceId });
}
