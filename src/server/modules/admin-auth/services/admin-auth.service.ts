import "server-only";
import type { IAdminAuthProvider } from "../interfaces/admin-auth.provider.interface";
import type { IAdminAuthService } from "../interfaces/admin-auth.service.interface";

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

  async confirmMagicLink(tokenHash: string, type: "email" | "magiclink") {
    await this.provider.confirmMagicLink(tokenHash, type);
    await this.requireAdmin();
  }

  async signOut() {
    await this.provider.signOut();
  }
}
