"use client";

import { useActionState } from "react";
import { Button } from "@/app/_components/ui/Button";
import { Input } from "@/app/_components/ui/Input";
import { Label } from "@/app/_components/ui/Label";
import { requestAdminMagicLink } from "./actions";

type LoginState = { status: "idle" | "success" | "error"; message: string };
const initialState: LoginState = { status: "idle", message: "" };

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(requestAdminMagicLink, initialState);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="admin-email">Approved admin email</Label>
        <Input id="admin-email" name="email" type="email" autoComplete="email" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending secure link…" : "Email me a sign-in link"}
      </Button>
      {state.message ? (
        <p
          role="status"
          className={state.status === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
