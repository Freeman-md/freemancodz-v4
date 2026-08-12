import assert from "node:assert/strict";
import test from "node:test";
import type { IAdminAuthProvider } from "@/server/modules/admin-auth/interfaces/admin-auth.provider.interface";
import {
  AdminAuthService,
  AdminAuthenticationError,
} from "@/server/modules/admin-auth/services/admin-auth.service";

const approvedEmail = "freemanmadudili@gmail.com";

function provider(
  identity: { id: string; email: string } | null,
): IAdminAuthProvider & { requested: string[] } {
  const requested: string[] = [];

  return {
    requested,
    getIdentity: async () => identity,
    requestMagicLink: async (email) => {
      requested.push(email);
    },
    confirmMagicLink: async () => undefined,
    signOut: async () => undefined,
  };
}

test("admin authorization requires verified claims for the one approved email", async () => {
  await assert.rejects(
    () => new AdminAuthService(provider(null), approvedEmail).requireAdmin(),
    (error: unknown) =>
      error instanceof AdminAuthenticationError && error.code === "UNAUTHENTICATED",
  );
  await assert.rejects(
    () =>
      new AdminAuthService(
        provider({ id: "other", email: "other@example.com" }),
        approvedEmail,
      ).requireAdmin(),
    (error: unknown) => error instanceof AdminAuthenticationError && error.code === "FORBIDDEN",
  );
  assert.equal(
    (
      await new AdminAuthService(
        provider({ id: "admin", email: approvedEmail }),
        approvedEmail,
      ).requireAdmin()
    ).id,
    "admin",
  );
});

test("magic-link requests deny non-approved addresses before Supabase is called", async () => {
  const fake = provider(null);

  const service = new AdminAuthService(fake, approvedEmail);

  await assert.rejects(
    () => service.requestMagicLink("attacker@example.com", "https://portfolio.test/auth/confirm"),
    AdminAuthenticationError,
  );
  assert.deepEqual(fake.requested, []);
  await service.requestMagicLink(
    ` ${approvedEmail.toUpperCase()} `,
    "https://portfolio.test/auth/confirm",
  );
  assert.deepEqual(fake.requested, [approvedEmail]);
});
