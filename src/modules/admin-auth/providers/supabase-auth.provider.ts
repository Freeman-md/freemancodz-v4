import "server-only";
import { isAuthApiError, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminAuthProviderOperation,
  AdminIdentity,
  IAdminAuthProvider,
} from "../interfaces/admin-auth.provider.interface";
import { AdminAuthProviderError } from "../interfaces/admin-auth.provider.interface";

type SupabaseAuthClientFactory = () => Promise<SupabaseClient>;
type SupabaseAdminAuthClientFactory = () => SupabaseClient;

export class SupabaseAuthProvider implements IAdminAuthProvider {
  constructor(
    private readonly createClient: SupabaseAuthClientFactory,
    private readonly createAdminClient: SupabaseAdminAuthClientFactory,
  ) {}

  async findUserByEmail(email: string): Promise<AdminIdentity | null> {
    return this.execute("find_user_by_email", async () => {
      const client = this.createAdminClient();

      for (let page = 1; ; page += 1) {
        const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });

        if (error) {
          throw this.toProviderError("find_user_by_email", error);
        }

        const user = data.users.find((candidate) => candidate.email?.trim().toLowerCase() === email);

        if (user?.email) {
          return { id: user.id, email: user.email.trim().toLowerCase() };
        }

        if (data.users.length < 100) {
          return null;
        }
      }
    });
  }

  async createConfirmedUser(email: string): Promise<AdminIdentity> {
    return this.execute("create_confirmed_user", async () => {
      const { data, error } = await this.createAdminClient().auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (error) {
        throw this.toProviderError("create_confirmed_user", error);
      }

      if (!data.user?.email) {
        throw this.toProviderError("create_confirmed_user");
      }

      return { id: data.user.id, email: data.user.email.trim().toLowerCase() };
    });
  }

  async getIdentity(): Promise<AdminIdentity | null> {
    return this.execute("get_identity", async () => {
      const client = await this.createClient();

      const { data, error } = await client.auth.getClaims();

      if (error) {
        throw this.toProviderError("get_identity", error);
      }

      if (!data?.claims.sub || typeof data.claims.email !== "string") {
        return null;
      }

      return { id: data.claims.sub, email: data.claims.email.toLowerCase() };
    });
  }

  async requestMagicLink(email: string, redirectTo: string): Promise<void> {
    return this.execute("request_magic_link", async () => {
      const client = await this.createClient();

      const { error } = await client.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
      });

      if (error) {
        throw this.toProviderError("request_magic_link", error);
      }
    });
  }

  async confirmMagicLink(tokenHash: string): Promise<void> {
    return this.execute("confirm_magic_link", async () => {
      const client = await this.createClient();

      const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: "email" });

      if (error) {
        throw this.toProviderError("confirm_magic_link", error);
      }
    });
  }

  async signOut(): Promise<void> {
    return this.execute("sign_out", async () => {
      const client = await this.createClient();

      const { error } = await client.auth.signOut();

      if (error) {
        throw this.toProviderError("sign_out", error);
      }
    });
  }

  private async execute<T>(
    operation: AdminAuthProviderOperation,
    callback: () => Promise<T>,
  ): Promise<T> {
    try {
      return await callback();
    } catch (error) {
      if (error instanceof AdminAuthProviderError) {
        throw error;
      }

      throw this.toProviderError(operation, error);
    }
  }

  private toProviderError(
    operation: AdminAuthProviderOperation,
    error?: unknown,
  ): AdminAuthProviderError {
    if (isAuthApiError(error)) {
      return new AdminAuthProviderError({
        provider: "supabase",
        operation,
        code: error.code ?? "auth_api_error",
        status: error.status,
      });
    }

    return new AdminAuthProviderError({
      provider: "supabase",
      operation,
      code: "auth_client_error",
      status: null,
    });
  }
}
