import "server-only";
import type { ILogger } from "../../../infrastructure/logging/logger.interface";
import {
  AdminAuthProviderError,
  type AdminAuthProviderOperation,
  type IAdminAuthProvider,
} from "../interfaces/admin-auth.provider.interface";
import type { IAdminAuthService } from "../interfaces/admin-auth.service.interface";

export class AdminAuthProvisioningError extends Error { constructor() { super("Administrator provisioning could not be completed."); this.name = "AdminAuthProvisioningError"; } }

export class AdminAuthenticationError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
  ) {
    super(message);
    this.name = "AdminAuthenticationError";
  }
}

export class AdminAuthService implements IAdminAuthService {
  constructor(
    private readonly provider: IAdminAuthProvider,
    private readonly approvedEmail: string,
    private readonly logger: ILogger,
  ) {}

  async requireAdmin() {
    const identity = await this.provider.getIdentity();

    if (!identity) {
      throw new AdminAuthenticationError("Authentication is required.", "UNAUTHENTICATED");
    }

    if (identity.email !== this.approvedEmail) {
      throw new AdminAuthenticationError("This account is not authorised.", "FORBIDDEN");
    }

    return identity;
  }

  async requestMagicLink(email: string, redirectTo: string) {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail !== this.approvedEmail) {
      throw new AdminAuthenticationError("This account is not authorised.", "FORBIDDEN");
    }

    try {
      await this.provider.requestMagicLink(normalizedEmail, redirectTo);
    } catch (error) {
      this.logFailure("admin_auth.magic_link_request_failed", "request_magic_link", error);
      throw error;
    }
  }

  async confirmMagicLink(tokenHash: string) {
    try {
      await this.provider.confirmMagicLink(tokenHash);
      await this.requireAdmin();
    } catch (error) {
      this.logFailure("admin_auth.magic_link_confirmation_failed", "confirm_magic_link", error);
      throw error;
    }
  }

  async signOut() {
    try {
      await this.provider.signOut();
    } catch (error) {
      this.logFailure("admin_auth.sign_out_failed", "sign_out", error);
      throw error;
    }
  }

  async provisionApprovedAdmin() {
    const email = this.approvedEmail.trim().toLowerCase();

    try {
      const existing = await this.provider.findUserByEmail(email);

      if (existing) {return this.verifyProvisionedIdentity(existing, "existing", email);}

      try { return this.verifyProvisionedIdentity(await this.provider.createConfirmedUser(email), "created", email); }
      catch (createError) {
        const raced = await this.provider.findUserByEmail(email);

        if (raced) {return this.verifyProvisionedIdentity(raced, "existing", email);}

        throw createError;
      }
    } catch (error) {
      this.logFailure("admin_auth.provisioning_failed", "find_user_by_email", error);

      if (error instanceof AdminAuthProvisioningError) {throw error;}

      throw new AdminAuthProvisioningError();
    }
  }

  private verifyProvisionedIdentity(identity: { id: string; email: string }, status: "created" | "existing", email: string) {
    if (!identity.id || identity.email.trim().toLowerCase() !== email) {throw new AdminAuthProvisioningError();}

    return { status, userId: identity.id, email };
  }

  private logFailure(
    event: string,
    operation: AdminAuthProviderOperation,
    error: unknown,
  ): void {
    if (error instanceof AdminAuthProviderError) {
      this.logger.error(event, error.context);

      return;
    }

    this.logger.error(event, {
      provider: "unknown",
      operation,
      code: "unexpected_error",
      status: null,
      errorName: this.getSafeErrorName(error),
    });
  }

  private getSafeErrorName(error: unknown): string {
    if (error instanceof Error) {
      return "Error";
    }

    return "UnknownError";
  }
}
