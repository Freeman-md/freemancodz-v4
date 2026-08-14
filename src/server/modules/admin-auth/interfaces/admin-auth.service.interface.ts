import type { AdminIdentity } from "./admin-auth.provider.interface";

export interface IAdminAuthService {
  requireAdmin(): Promise<AdminIdentity>;
  requestMagicLink(email: string, redirectTo: string): Promise<void>;
  confirmMagicLink(tokenHash: string): Promise<void>;
  signOut(): Promise<void>;
}
