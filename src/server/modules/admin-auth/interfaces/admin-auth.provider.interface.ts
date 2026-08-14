export type AdminIdentity = { id: string; email: string };

export interface IAdminAuthProvider {
  getIdentity(): Promise<AdminIdentity | null>;
  requestMagicLink(email: string, redirectTo: string): Promise<void>;
  confirmMagicLink(tokenHash: string): Promise<void>;
  signOut(): Promise<void>;
}
