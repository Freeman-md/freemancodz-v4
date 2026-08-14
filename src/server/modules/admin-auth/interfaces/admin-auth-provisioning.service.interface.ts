import type { AdminAuthProvisioningResult } from "../models/admin-auth-provisioning";

export interface IAdminAuthProvisioningService {
  provisionApprovedAdmin(): Promise<AdminAuthProvisioningResult>;
}
