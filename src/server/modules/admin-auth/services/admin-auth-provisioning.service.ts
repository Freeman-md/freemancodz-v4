import "server-only";
import type { IAdminAuthProvisioningProvider } from "../interfaces/admin-auth-provisioning.provider.interface";
import type { IAdminAuthProvisioningService } from "../interfaces/admin-auth-provisioning.service.interface";

export class AdminAuthProvisioningError extends Error {
  constructor(message = "Administrator provisioning could not be completed.") {
    super(message);
    this.name = "AdminAuthProvisioningError";
  }
}

export class AdminAuthProvisioningService implements IAdminAuthProvisioningService {
  constructor(
    private readonly provider: IAdminAuthProvisioningProvider,
    private readonly approvedEmail: string,
  ) {}

  async provisionApprovedAdmin() {
    const email = this.approvedEmail.trim().toLowerCase();

    const existing = await this.provider.findUserByEmail(email);

    if (existing) {
      return this.verify(existing, "existing", email);
    }

    try {
      return this.verify(await this.provider.createConfirmedUser(email), "created", email);
    } catch {
      const racedUser = await this.provider.findUserByEmail(email);

      if (racedUser) {
        return this.verify(racedUser, "existing", email);
      }

      throw new AdminAuthProvisioningError();
    }
  }

  private verify(user: { id: string; email: string }, status: "created" | "existing", email: string) {
    if (!user.id || user.email !== email) {
      throw new AdminAuthProvisioningError();
    }

    return { status, userId: user.id, email };
  }
}
