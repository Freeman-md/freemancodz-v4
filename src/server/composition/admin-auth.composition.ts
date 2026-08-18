import "server-only";
import { getAdminEmail } from "../infrastructure/config/env";
import { createSupabaseAdminAuthClient } from "../infrastructure/supabase/supabase-admin-auth.client";
import { createSupabaseAuthClient } from "../infrastructure/supabase/supabase-auth.client";
import { logger } from "./logging.composition";
import { SupabaseAuthProvider } from "../modules/admin-auth/providers/supabase-auth.provider";
import { AdminAuthService } from "../modules/admin-auth/services/admin-auth.service";
import type { IAdminAuthService } from "../modules/admin-auth/interfaces/admin-auth.service.interface";

export const adminAuthService: IAdminAuthService = new AdminAuthService(
  new SupabaseAuthProvider(createSupabaseAuthClient, createSupabaseAdminAuthClient),
  getAdminEmail(),
  logger,
);

