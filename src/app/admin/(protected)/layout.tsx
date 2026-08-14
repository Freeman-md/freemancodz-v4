import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { adminAuthService } from "@/server/composition-root";
import { Container } from "@/shared/components/layout/Container";
import { Button } from "@/shared/components/ui/Button";
import { signOutAdmin } from "../login/actions";

const navigation = [
  ["Overview", "/admin"],
  ["Pages", "/admin/pages/home"],
  ["Profile", "/admin/profile"],
  ["Projects", "/admin/projects"],
  ["Experience", "/admin/experiences"],
  ["Media", "/admin/media"],
  ["Reusable blocks", "/admin/reusable"],
] as const;

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  try {
    await adminAuthService.requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  return (
    <Container className="grid min-h-[80vh] lg:grid-cols-[260px_1fr]">
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
      <main className="min-w-0 p-5 sm:p-8 lg:p-10">{children}</main>
    </Container>
  );
}
