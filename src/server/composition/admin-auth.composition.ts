import "server-only";
import { getAdminEmail } from "../infrastructure/config/env";
import { createSupabaseAdminAuthClient } from "../infrastructure/supabase/supabase-admin-auth.client";
import { SupabaseAdminAuthProvider } from "../modules/admin-auth/providers/supabase-admin-auth.provider";
import { AdminAuthProvisioningService } from "../modules/admin-auth/services/admin-auth-provisioning.service";
import type { IAdminAuthProvisioningService } from "../modules/admin-auth/interfaces/admin-auth-provisioning.service.interface";

export const adminAuthProvisioningService: IAdminAuthProvisioningService =
  new AdminAuthProvisioningService(
    new SupabaseAdminAuthProvider(createSupabaseAdminAuthClient()),
    getAdminEmail(),
  );
