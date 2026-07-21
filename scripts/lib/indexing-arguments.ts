import type { IndexableSourceType } from "@/features/search-index/types";

const supportedSourceTypes = [
  "content_blocks",
  "projects",
  "services",
  "principles",
  "experiences",
] as const satisfies readonly IndexableSourceType[];

export function parseSourceArguments(): {
  sourceType: IndexableSourceType;
  sourceId: string;
} {
  const [, , sourceType, sourceId] = process.argv;

  if (
    !sourceType ||
    !supportedSourceTypes.includes(sourceType as IndexableSourceType)
  ) {
    throw new Error(
      `Source type must be one of: ${supportedSourceTypes.join(", ")}.`,
    );
  }

  if (!sourceId) {
    throw new Error("Source ID is required.");
  }

  return {
    sourceType: sourceType as IndexableSourceType,
    sourceId,
  };
}