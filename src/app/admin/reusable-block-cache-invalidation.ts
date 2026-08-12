import { PortfolioCacheTag } from "@/server/modules/portfolio/public";

export function invalidateReusableBlockUpdate(
  type: "action" | "media",
  id: string,
  invalidate: (tag: string) => void,
) {
  invalidate(type === "action"
    ? PortfolioCacheTag.actionBlock(id)
    : PortfolioCacheTag.mediaBlock(id));
  invalidate(PortfolioCacheTag.iconBlock(id));
}
