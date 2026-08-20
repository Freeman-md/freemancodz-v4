import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/Card";

const areas = [
  ["Audit requests", "Review submitted customer journey and workflow audits.", "/admin/audits"],
  ["Pages", "Edit the semantic sections used by Home, Work, About and Audit.", "/admin/pages/home"],
  ["Profile", "Maintain the singleton profile and its ordered icon collections.", "/admin/profile"],
  [
    "Projects",
    "Manage curated case studies, featured state and presentation metadata.",
    "/admin/projects",
  ],
  ["Experience", "Maintain ordered experience entries and related icons.", "/admin/experiences"],
  ["Media", "Upload protected replacements with preview and compensating cleanup.", "/admin/media"],
  ["Reusable blocks", "Manage shared icons, actions and media metadata safely.", "/admin/reusable"],
] as const;

export default function AdminOverviewPage() {
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">Content overview</h1>
      <p className="mt-2 text-muted">
        Choose a domain area. Public pages are refreshed with targeted cache tags after a successful
        save.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {areas.map(([title, copy, href]) => (
          <Link key={href} href={href}>
            <Card className="h-full border border-line transition hover:-translate-y-0.5 hover:border-signal-200 hover:shadow-lg">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{copy}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm font-semibold text-signal-700">
                Open editor →
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
