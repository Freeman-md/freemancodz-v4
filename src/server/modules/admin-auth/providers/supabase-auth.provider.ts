import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminIdentity,
  IAdminAuthProvider,
} from "../interfaces/admin-auth.provider.interface";

type SupabaseAuthClientFactory = () => Promise<SupabaseClient>;

export class AdminAuthenticationProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthenticationProviderError";
  }
}

export class SupabaseAuthProvider implements IAdminAuthProvider {
  constructor(private readonly createClient: SupabaseAuthClientFactory) {}

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
