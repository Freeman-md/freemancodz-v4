import type { AdminIdentity } from "./admin-auth.provider.interface";
export type AdminAuthProvisioningResult = { status: "created" | "existing"; userId: string; email: string };

export interface IAdminAuthService {
  requireAdmin(): Promise<AdminIdentity>;
  requestMagicLink(email: string, redirectTo: string): Promise<void>;
  confirmMagicLink(tokenHash: string): Promise<void>;
  signOut(): Promise<void>;
  provisionApprovedAdmin(): Promise<AdminAuthProvisioningResult>;
}
