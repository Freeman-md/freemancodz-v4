import { type NextRequest, NextResponse } from "next/server";

const allowedGeneratedRoutes = new Set(["/opengraph-image", "/robots.txt", "/sitemap.xml"]);

function normalizePagePath(path: string) {
  return path !== "/" ? path.replace(/\/$/, "") : path;
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const normalizedPath = normalizePagePath(path);

  const isAsset =
    path.startsWith("/_next/") ||
    path.startsWith("/_vercel/") ||
    path.startsWith("/images/") ||
    path.startsWith("/videos/") ||
    path === "/favicon.ico" ||
    path === "/icon.svg";

  const isApiRoute = path === "/api" || path.startsWith("/api/");

  if (/^\/(?:admin|auth)(?:\/|$)/.test(normalizedPath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const isAllowedRoute =
    normalizedPath === "/" ||
    normalizedPath === "/work" ||
    /^\/work\/[^/]+$/.test(normalizedPath) ||
    allowedGeneratedRoutes.has(path);

  if (isAsset || isApiRoute || isAllowedRoute) {
    return NextResponse.next();
  }

  const destination = req.nextUrl.clone();

  destination.pathname = "/";

  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
