import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminIdentity,
  IAdminAuthProvider,
} from "../interfaces/admin-auth.provider.interface";

type SupabaseAuthClientFactory = () => Promise<SupabaseClient>;
type SupabaseAdminAuthClientFactory = () => SupabaseClient;

export class AdminAuthenticationProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthenticationProviderError";
  }
}

export class SupabaseAuthProvider implements IAdminAuthProvider {
  constructor(private readonly createClient: SupabaseAuthClientFactory, private readonly createAdminClient: SupabaseAdminAuthClientFactory) {}

  async findUserByEmail(email: string): Promise<AdminIdentity | null> {
    const client = this.createAdminClient();

    for (let page = 1; ; page += 1) {
      const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });

      if (error) {throw new AdminAuthenticationProviderError("Administrator provisioning could not be completed.");}

      const user = data.users.find((candidate) => candidate.email?.trim().toLowerCase() === email);

      if (user?.email) {return { id: user.id, email: user.email.trim().toLowerCase() };}

      if (data.users.length < 100) {return null;}
    }
  }

  async createConfirmedUser(email: string): Promise<AdminIdentity> {
    const { data, error } = await this.createAdminClient().auth.admin.createUser({ email, email_confirm: true });

    if (error || !data.user?.email) {throw new AdminAuthenticationProviderError("Administrator provisioning could not be completed.");}

    return { id: data.user.id, email: data.user.email.trim().toLowerCase() };
  }

  async getIdentity(): Promise<AdminIdentity | null> {
    const client = await this.createClient();

    const { data, error } = await client.auth.getClaims();

    if (error || !data?.claims.sub || typeof data.claims.email !== "string") {
      return null;
    }

    return { id: data.claims.sub, email: data.claims.email.toLowerCase() };
  }

  async requestMagicLink(email: string, redirectTo: string) {
    const client = await this.createClient();

    const { error } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    });

    if (error) {
      throw new AdminAuthenticationProviderError("The sign-in link could not be sent.");
    }
  }

  async confirmMagicLink(tokenHash: string) {
    const client = await this.createClient();

    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: "email" });

    if (error) {
      throw new AdminAuthenticationProviderError("The sign-in link is invalid or expired.");
    }
  }

  async signOut() {
    const client = await this.createClient();

    const { error } = await client.auth.signOut();

    if (error) {
      throw new AdminAuthenticationProviderError("Sign out failed.");
    }
  }
}
