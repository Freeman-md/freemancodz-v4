import type { NextRequest } from "next/server";

export function isSameWorkflowOrigin(request: NextRequest) {
  const host = request.headers.get("host") ?? request.nextUrl.host;

  const protocol = process.env.VERCEL === "1" ? "https:" : request.nextUrl.protocol;

  // Next may use its bind address for nextUrl on a self-hosted production server.
  return request.headers.get("origin") === `${protocol}//${host}`;
}
