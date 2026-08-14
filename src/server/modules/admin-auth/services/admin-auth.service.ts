import "server-only";
import type { IAdminAuthProvider } from "../interfaces/admin-auth.provider.interface";
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

    await this.provider.requestMagicLink(normalizedEmail, redirectTo);
  }

  async confirmMagicLink(tokenHash: string) {
    await this.provider.confirmMagicLink(tokenHash);
    await this.requireAdmin();
  }

  async signOut() {
    await this.provider.signOut();
  }

  async provisionApprovedAdmin() {
    const email = this.approvedEmail.trim().toLowerCase();

    try {
      const existing = await this.provider.findUserByEmail(email);

      if (existing) {return this.verifyProvisionedIdentity(existing, "existing", email);}

      try { return this.verifyProvisionedIdentity(await this.provider.createConfirmedUser(email), "created", email); }
      catch {
        const raced = await this.provider.findUserByEmail(email);

        if (raced) {return this.verifyProvisionedIdentity(raced, "existing", email);}

        throw new AdminAuthProvisioningError();
      }
    } catch (error) {
      if (error instanceof AdminAuthProvisioningError) {throw error;}

      throw new AdminAuthProvisioningError();
    }
  }

  private verifyProvisionedIdentity(identity: { id: string; email: string }, status: "created" | "existing", email: string) {
    if (!identity.id || identity.email.trim().toLowerCase() !== email) {throw new AdminAuthProvisioningError();}

    return { status, userId: identity.id, email };
  }
}
