import { type NextRequest, NextResponse } from "next/server";

const allowedPageRoutes = new Set(["/", "/work", "/about", "/audit"]);

const allowedGeneratedRoutes = new Set(["/opengraph-image", "/robots.txt", "/sitemap.xml"]);

function hasFileExtension(path: string) {
  return /\.[a-zA-Z0-9]+$/.test(path);
}

function normalizePagePath(path: string) {
  return path !== "/" ? path.replace(/\/$/, "") : path;
}

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const normalizedPath = normalizePagePath(path);

  const isAsset =
    path.startsWith("/_next") ||
    path.startsWith("/_vercel") ||
    path.startsWith("/images") ||
    path === "/favicon.ico" ||
    hasFileExtension(path);

  const isApiRoute = path.startsWith("/api");

  const isAllowedRoute = allowedPageRoutes.has(normalizedPath) || allowedGeneratedRoutes.has(path);

  if (isAsset || isApiRoute || isAllowedRoute) {
    return NextResponse.next();
  }

  console.log({
    blocked: true,
    path,
    country: req.headers.get("x-vercel-ip-country"),
    city: req.headers.get("x-vercel-ip-city"),
    userAgent: req.headers.get("user-agent"),
    referer: req.headers.get("referer"),
    ip: req.headers.get("x-forwarded-for"),
    time: new Date().toISOString(),
  });

  return new NextResponse("Not found", { status: 404 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
