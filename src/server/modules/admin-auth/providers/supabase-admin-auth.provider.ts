import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  IAdminAuthProvisioningProvider,
  ProvisionedAdminIdentity,
} from "../interfaces/admin-auth-provisioning.provider.interface";

export class SupabaseAdminAuthProviderError extends Error {
  constructor() {
    super("Administrator provisioning could not be completed.");
    this.name = "SupabaseAdminAuthProviderError";
  }
}

export class SupabaseAdminAuthProvider implements IAdminAuthProvisioningProvider {
  constructor(private readonly client: SupabaseClient) {}

  async findUserByEmail(email: string): Promise<ProvisionedAdminIdentity | null> {
    for (let page = 1; ; page += 1) {
      const { data, error } = await this.client.auth.admin.listUsers({ page, perPage: 100 });

      if (error) {
        throw new SupabaseAdminAuthProviderError();
      }

      const user = data.users.find((candidate) => candidate.email?.trim().toLowerCase() === email);

      if (user?.email) {
        return { id: user.id, email: user.email.trim().toLowerCase() };
      }

      if (data.users.length < 100) {
        return null;
      }
    }
  }

  async createConfirmedUser(email: string): Promise<ProvisionedAdminIdentity> {
    const { data, error } = await this.client.auth.admin.createUser({ email, email_confirm: true });

    if (error || !data.user?.email) {
      throw new SupabaseAdminAuthProviderError();
    }

    return { id: data.user.id, email: data.user.email.trim().toLowerCase() };
  }
}
