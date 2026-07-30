import { NextRequest, NextResponse } from "next/server";
import { portfolioAssetPathSchema } from "@/contracts/portfolio-asset.contract";
import { getPortfolioAsset } from "@/server/modules/portfolio/public";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pathname: string[] }> },
) {
  const { pathname: pathnameSegments } = await params;
  const parsedPathname = portfolioAssetPathSchema.safeParse(pathnameSegments.join("/"));
  if (!parsedPathname.success) return new NextResponse("Not found", { status: 404 });

  const result = await getPortfolioAsset(parsedPathname.data);

  if (result.kind === "missing") {
    return new NextResponse("Not found", { status: 404 });
  }

  const headers = new Headers({
    "Cache-Control": "private, no-cache",
    "X-Content-Type-Options": "nosniff",
  });

  if (result.contentType) {
    headers.set("Content-Type", result.contentType);
  }

  return new NextResponse(result.stream, { headers });
}
