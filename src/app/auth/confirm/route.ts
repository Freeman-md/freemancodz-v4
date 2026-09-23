import { NextResponse, type NextRequest } from "next/server";
import { adminAuthService } from "@/modules/composition";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");

  const type = request.nextUrl.searchParams.get("type");

  if (!tokenHash || type !== "email") {
    return NextResponse.redirect(new URL("/admin/login?error=invalid-link", request.url));
  }

  try {
    await adminAuthService.confirmMagicLink(tokenHash);

    return NextResponse.redirect(new URL("/admin", request.url));
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=invalid-link", request.url));
  }
}
