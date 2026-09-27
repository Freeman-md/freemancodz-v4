import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminActionsProvider } from "../_components/AdminEditors";
import type { AdminActions } from "../types";
import { adminAuthService } from "@/modules/composition";
import { Container } from "@/app/_components/layout/Container";
import { Button } from "@/app/_components/ui/Button";
import {
  createActionBlockAction,
  createExperienceAction,
  createIconBlockAction,
  createProjectAction,
  deleteActionBlockAction,
  deleteExperienceAction,
  deleteIconBlockAction,
  deleteMediaBlockAction,
  deleteProjectAction,
  updateActionBlockAction,
  updateContentBlockAction,
  updateContentRelationsAction,
  updateExperienceAction,
  updateExperienceIconsAction,
  updateIconBlockAction,
  updateMediaBlockAction,
  updateProfileAction,
  updateProfileCollectionAction,
  updateProjectAction,
} from "../actions";
import { signOutAdmin } from "../login/actions";

const navigation = [
  ["Overview", "/admin"],
  ["Audit requests", "/admin/audits"],
  ["Messages", "/admin/messages"],
  ["Pages", "/admin/pages/home"],
  ["Profile", "/admin/profile"],
  ["Projects", "/admin/projects"],
  ["Experience", "/admin/experiences"],
  ["Media", "/admin/media"],
  ["Reusable blocks", "/admin/reusable"],
] as const;

const adminActions: AdminActions = {
  updateProfileAction,
  updateProfileCollectionAction,
  updateContentBlockAction,
  updateContentRelationsAction,
  updateExperienceIconsAction,
  createIconBlockAction,
  updateIconBlockAction,
  deleteIconBlockAction,
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  createExperienceAction,
  updateExperienceAction,
  deleteExperienceAction,
  createActionBlockAction,
  updateActionBlockAction,
  deleteActionBlockAction,
  updateMediaBlockAction,
  deleteMediaBlockAction,
};

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  try {
    await adminAuthService.requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  return (
    <Container className="grid min-h-[80vh] text-ink lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-line bg-white p-5 lg:border-r lg:border-b-0 lg:p-7">
        <p className="font-mono text-xs font-semibold tracking-[0.16em] text-signal-700 uppercase">
          Portfolio content
        </p>
        <nav
          aria-label="Admin"
          className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1"
        >
          {navigation.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-signal-50 hover:text-signal-800"
            >
              {label}
            </Link>
          ))}
        </nav>
        <form action={signOutAdmin} className="mt-7">
          <Button variant="outline" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </aside>
      <main className="min-w-0 bg-white p-5 sm:p-8 lg:p-10">
        <AdminActionsProvider actions={adminActions}>{children}</AdminActionsProvider>
      </main>
    </Container>
  );
}
