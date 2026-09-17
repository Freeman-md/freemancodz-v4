import { type NextRequest, NextResponse } from "next/server";
import { getAdminEmail } from "@/server/infrastructure/config/env";
import { refreshSupabaseAuth } from "@/server/infrastructure/supabase/refresh-supabase-auth";

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
    path === "/favicon.ico" ||
    path === "/icon.svg";

  const isApiRoute = path === "/api" || path.startsWith("/api/");

  const isAdminRoute = normalizedPath === "/admin" || normalizedPath.startsWith("/admin/");

  const isAuthRoute = normalizedPath.startsWith("/auth/");

  if (isAdminRoute || isAuthRoute) {
    const { response, claims } = await refreshSupabaseAuth(req);

    const isApprovedAdmin =
      typeof claims?.email === "string" && claims.email.toLowerCase() === getAdminEmail();

    if (isAdminRoute && normalizedPath !== "/admin/login" && !isApprovedAdmin) {
      return NextResponse.redirect(new URL("/admin/login", req.url), {
        headers: response.headers,
      });
    }

    if (normalizedPath === "/admin/login" && isApprovedAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url), { headers: response.headers });
    }

    return response;
  }

  const isAllowedRoute = normalizedPath === "/" || allowedGeneratedRoutes.has(path);

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
