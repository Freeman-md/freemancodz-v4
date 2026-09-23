import assert from "node:assert/strict";
import test from "node:test";
import type { Logger } from "@/infrastructure/logging/logger";
import {
  AdminAuthProviderError,
  type AdminAuthProvider,
} from "@/modules/admin-auth/types";
import {
  AdminAuthProvisioningError,
  AdminAuthService,
  AdminAuthenticationError,
} from "@/modules/admin-auth/service";

const approvedEmail = "freemanmadudili@gmail.com";

type FakeLogger = Logger & { entries: Array<{ event: string; context: unknown }> };

function logger(): FakeLogger {
  const entries: Array<{ event: string; context: unknown }> = [];

  return {
    entries,
    error: (event, context) => entries.push({ event, context }),
    info: () => undefined,
  };
}

function provider(
  identity: { id: string; email: string } | null,
): AdminAuthProvider & { requested: string[] } {
  const requested: string[] = [];

  return {
    requested,
    getIdentity: async () => identity,
    findUserByEmail: async () => null,
    createConfirmedUser: async (email) => ({ id: "created", email }),
    requestMagicLink: async (email) => {
      requested.push(email);
    },
    confirmMagicLink: async () => undefined,
    signOut: async () => undefined,
  };
}

function service(fake: AdminAuthProvider, fakeLogger = logger()): {
  service: AdminAuthService;
  logger: FakeLogger;
} {
  return {
    service: new AdminAuthService(fake, approvedEmail, fakeLogger),
    logger: fakeLogger,
  };
}

function providerFailure(
  operation: "request_magic_link" | "confirm_magic_link" | "sign_out" | "create_confirmed_user",
) {
  return new AdminAuthProviderError({
    provider: "supabase",
    operation,
    code: "smtp_not_configured",
    status: 500,
  });
}

test("admin authorization requires verified claims for the one approved email", async () => {
  await assert.rejects(
    () => service(provider(null)).service.requireAdmin(),
    (error: unknown) =>
      error instanceof AdminAuthenticationError && error.code === "UNAUTHENTICATED",
  );
  await assert.rejects(
    () =>
      service(provider({ id: "other", email: "other@example.com" })).service
        .requireAdmin(),
    (error: unknown) => error instanceof AdminAuthenticationError && error.code === "FORBIDDEN",
  );
  assert.equal(
    (
      await service(provider({ id: "admin", email: approvedEmail })).service.requireAdmin()
    ).id,
    "admin",
  );
});

test("magic-link requests deny non-approved addresses before Supabase is called", async () => {
  const fake = provider(null);

  const { service: adminAuthService, logger: fakeLogger } = service(fake);

  await assert.rejects(
    () => adminAuthService.requestMagicLink("attacker@example.com", "https://portfolio.test/auth/confirm"),
    AdminAuthenticationError,
  );
  assert.deepEqual(fake.requested, []);
  await adminAuthService.requestMagicLink(
    ` ${approvedEmail.toUpperCase()} `,
    "https://portfolio.test/auth/confirm",
  );
  assert.deepEqual(fake.requested, [approvedEmail]);
  assert.deepEqual(fakeLogger.entries, []);
});

test("magic-link provider failures log one sanitised Supabase context", async () => {
  const fake = provider(null);

  const sensitiveEmail = "freemanmadudili@gmail.com";

  const sensitiveRedirect = "https://portfolio.test/auth/confirm?token=secret";

  const normalizedError = new AdminAuthProviderError({
    provider: "supabase",
    operation: "request_magic_link",
    code: "smtp_not_configured",
    status: 500,
  });

  fake.requestMagicLink = async () => {
    throw normalizedError;
  };

  const { service: adminAuthService, logger: fakeLogger } = service(fake);

  await assert.rejects(() => adminAuthService.requestMagicLink(sensitiveEmail, sensitiveRedirect));

  assert.deepEqual(fakeLogger.entries, [
    {
      event: "admin_auth.magic_link_request_failed",
      context: {
        provider: "supabase",
        operation: "request_magic_link",
        code: "smtp_not_configured",
        status: 500,
      },
    },
  ]);
  assert.notEqual(fakeLogger.entries[0]?.context as unknown, normalizedError);
  assert.equal(JSON.stringify(fakeLogger.entries).includes(sensitiveEmail), false);
  assert.equal(JSON.stringify(fakeLogger.entries).includes("token=secret"), false);
  assert.equal(JSON.stringify(fakeLogger.entries).includes(sensitiveRedirect), false);
});

test("unexpected errors are logged without their raw error object or sensitive details", async () => {
  const fake = provider(null);

  const rawError = new Error(
    "token=secret freemanmadudili@gmail.com https://portfolio.test/auth/confirm?token=secret",
  );

  fake.requestMagicLink = async () => {
    throw rawError;
  };

  const { service: adminAuthService, logger: fakeLogger } = service(fake);

  await assert.rejects(() =>
    adminAuthService.requestMagicLink(approvedEmail, "https://portfolio.test/auth/confirm?token=secret"),
  );

  assert.deepEqual(fakeLogger.entries, [
    {
      event: "admin_auth.magic_link_request_failed",
      context: {
        provider: "unknown",
        operation: "request_magic_link",
        code: "unexpected_error",
        status: null,
        errorName: "Error",
      },
    },
  ]);
  assert.notEqual(fakeLogger.entries[0]?.context as unknown, rawError);
  assert.equal(JSON.stringify(fakeLogger.entries).includes(rawError.message), false);
  assert.equal(JSON.stringify(fakeLogger.entries).includes("freemanmadudili@gmail.com"), false);
  assert.equal(JSON.stringify(fakeLogger.entries).includes("token=secret"), false);
  assert.equal(JSON.stringify(fakeLogger.entries).includes("https://portfolio.test"), false);
});

test("confirmation and sign-out failures use their dedicated events", async () => {
  const confirmationProvider = provider({ id: "admin", email: approvedEmail });

  confirmationProvider.confirmMagicLink = async () => {
    throw providerFailure("confirm_magic_link");
  };

  const confirmation = service(confirmationProvider);

  await assert.rejects(() => confirmation.service.confirmMagicLink("sensitive-token"));
  assert.equal(confirmation.logger.entries.length, 1);
  assert.equal(confirmation.logger.entries[0]?.event, "admin_auth.magic_link_confirmation_failed");
  assert.deepEqual(confirmation.logger.entries[0]?.context, {
    provider: "supabase",
    operation: "confirm_magic_link",
    code: "smtp_not_configured",
    status: 500,
  });

  const signOutProvider = provider(null);

  signOutProvider.signOut = async () => {
    throw providerFailure("sign_out");
  };

  const signOut = service(signOutProvider);

  await assert.rejects(() => signOut.service.signOut());
  assert.equal(signOut.logger.entries.length, 1);
  assert.equal(signOut.logger.entries[0]?.event, "admin_auth.sign_out_failed");
  assert.deepEqual(signOut.logger.entries[0]?.context, {
    provider: "supabase",
    operation: "sign_out",
    code: "smtp_not_configured",
    status: 500,
  });
});

test("provisioning failures produce one final log without a duplicate", async () => {
  const fake = provider(null);

  fake.createConfirmedUser = async () => {
    throw providerFailure("create_confirmed_user");
  };

  const { service: adminAuthService, logger: fakeLogger } = service(fake);

  await assert.rejects(() => adminAuthService.provisionApprovedAdmin(), AdminAuthProvisioningError);

  assert.deepEqual(fakeLogger.entries, [
    {
      event: "admin_auth.provisioning_failed",
      context: {
        provider: "supabase",
        operation: "create_confirmed_user",
        code: "smtp_not_configured",
        status: 500,
      },
    },
  ]);
});

test("successful Admin Auth operations are not logged", async () => {
  const fake = provider({ id: "admin", email: approvedEmail });

  const { service: adminAuthService, logger: fakeLogger } = service(fake);

  await adminAuthService.requestMagicLink(approvedEmail, "https://portfolio.test/auth/confirm");
  await adminAuthService.confirmMagicLink("safe-token");
  await adminAuthService.signOut();
  await adminAuthService.provisionApprovedAdmin();

  assert.deepEqual(fakeLogger.entries, []);
});
