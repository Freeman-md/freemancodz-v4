"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminAuthService, logger } from "@/server/composition-root";

const emailSchema = z.string().trim().email().max(320);

export async function requestAdminMagicLink(
  _state: { status: "idle" | "success" | "error"; message: string },
  formData: FormData,
): Promise<{ status: "idle" | "success" | "error"; message: string }> {
  const parsed = emailSchema.safeParse(formData.get("email"));

  if (!parsed.success) {
    return { status: "error" as const, message: "Enter a valid email address." };
  }

  try {
    const requestHeaders = await headers();

    const origin = requestHeaders.get("origin");

    if (!origin) {
      logger.error("admin_auth.magic_link_request_rejected", { reason: "missing_origin" });

      return { status: "error" as const, message: "Sign-in could not be started." };
    }

    await adminAuthService.requestMagicLink(parsed.data, `${origin}/auth/confirm`);

    return {
      status: "success" as const,
      message: "Check the approved admin inbox for the secure sign-in link.",
    };
  } catch {
    return { status: "error" as const, message: "Sign-in could not be started." };
  }
}

export async function signOutAdmin() {
  await adminAuthService.requireAdmin();
  await adminAuthService.signOut();
  redirect("/admin/login");
}
