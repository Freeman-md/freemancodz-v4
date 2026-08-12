import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/Card";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-lg items-center px-5 py-16">
      <Card className="w-full border border-line shadow-xl shadow-slate-200/40">
        <CardHeader className="space-y-2 border-b border-line">
          <p className="font-mono text-xs font-semibold tracking-[0.18em] text-signal-700 uppercase">
            Content admin
          </p>
          <CardTitle className="text-2xl">Sign in without a password</CardTitle>
          <CardDescription>
            Access is restricted to Freeman’s approved Supabase account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 py-6">
          {error ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
              That sign-in link is invalid or expired.
            </p>
          ) : null}
          <AdminLoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
