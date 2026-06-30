import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { pathname: string[] } },
) {
  const pathname = params.pathname.join("/");

  const result = await get(pathname, { access: "private" });

  if (result === null) {
    return new NextResponse("Not found", { status: 404 });
  }

  const headers = new Headers({
    "Cache-Control": "private, no-cache",
    "X-Content-Type-Options": "nosniff",
  });

  if (result.blob.contentType) {
    headers.set("Content-Type", result.blob.contentType);
  }

  return new NextResponse(result.stream, { headers });
}
