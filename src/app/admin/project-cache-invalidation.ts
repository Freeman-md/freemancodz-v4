import { type ProjectUpdateResult, PortfolioCacheTag } from "@/server/modules/portfolio/public";

export function invalidateProjectUpdate(
  result: ProjectUpdateResult,
  invalidate: (tag: string) => void,
) {
  invalidate(PortfolioCacheTag.project(result.slug));

  if (result.collectionChanged) {
    invalidate(PortfolioCacheTag.projects);
  }
}
