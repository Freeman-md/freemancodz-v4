import type { ProjectUpdateResult } from "@/modules/portfolio/types";
import { PortfolioCacheTag } from "@/modules/portfolio/cache-tags";

export function invalidateProjectUpdate(
  result: ProjectUpdateResult,
  invalidate: (tag: string) => void,
) {
  invalidate(PortfolioCacheTag.project(result.slug));

  if (result.collectionChanged) {
    invalidate(PortfolioCacheTag.projects);
  }
}
