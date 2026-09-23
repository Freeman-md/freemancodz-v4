export type AdminIdentity = { id: string; email: string };

export type AdminAuthOperation =
  | "get_identity"
  | "find_user_by_email"
  | "create_confirmed_user"
  | "request_magic_link"
  | "confirm_magic_link"
  | "sign_out";

export type AdminAuthFailureContext = {
  provider: "supabase" | "unknown";
  operation: AdminAuthOperation;
  code: string;
  status: number | null;
};

export class AdminAuthProviderError extends Error {
  constructor(readonly context: AdminAuthFailureContext) {
    super("Admin Auth provider operation failed.");
    this.name = "AdminAuthProviderError";
  }
}

export type AdminAuthProvider = {
  getIdentity(): Promise<AdminIdentity | null>;
  findUserByEmail(email: string): Promise<AdminIdentity | null>;
  createConfirmedUser(email: string): Promise<AdminIdentity>;
  requestMagicLink(email: string, redirectTo: string): Promise<void>;
  confirmMagicLink(tokenHash: string): Promise<void>;
  signOut(): Promise<void>;
};

export type AdminAuthProvisioningResult = {
  status: "created" | "existing";
  userId: string;
  email: string;
};
