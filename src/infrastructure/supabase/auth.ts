import "server-only";
import { isAuthApiError, type SupabaseClient } from "@supabase/supabase-js";
type AdminIdentity = { id: string; email: string };
type AdminAuthOperation =
  | "get_identity"
  | "find_user_by_email"
  | "create_confirmed_user"
  | "request_magic_link"
  | "confirm_magic_link"
  | "sign_out";
type AdminAuthFailureContext = {
  provider: "supabase";
  operation: AdminAuthOperation;
  code: string;
  status: number | null;
};

export class SupabaseAuthError extends Error {
  constructor(readonly context: AdminAuthFailureContext) {
    super("Supabase auth operation failed.");
    this.name = "SupabaseAuthError";
  }
}

type SupabaseAuthClientFactory = () => Promise<SupabaseClient>;
type SupabaseAdminAuthClientFactory = () => SupabaseClient;

export class SupabaseAuth {
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
    operation: AdminAuthOperation,
    callback: () => Promise<T>,
  ): Promise<T> {
    try {
      return await callback();
    } catch (error) {
      if (error instanceof SupabaseAuthError) {
        throw error;
      }

      throw this.toProviderError(operation, error);
    }
  }

  private toProviderError(
    operation: AdminAuthOperation,
    error?: unknown,
  ): SupabaseAuthError {
    if (isAuthApiError(error)) {
      return new SupabaseAuthError({
        provider: "supabase",
        operation,
        code: error.code ?? "auth_api_error",
        status: error.status,
      });
    }

    return new SupabaseAuthError({
      provider: "supabase",
      operation,
      code: "auth_client_error",
      status: null,
    });
  }
}
