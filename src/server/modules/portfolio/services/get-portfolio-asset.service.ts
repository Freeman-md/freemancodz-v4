import "server-only";

import { getPrivateBlob } from "../providers/vercel-blob.provider";
import type { PortfolioAsset } from "../models/portfolio-asset.model";

export async function getPortfolioAsset(pathname: string): Promise<PortfolioAsset> {
  const result = await getPrivateBlob(pathname);
  if (result === null || result.stream === null) return { kind: "missing" };
  return { kind: "stream", stream: result.stream, contentType: result.blob.contentType ?? null };
}
