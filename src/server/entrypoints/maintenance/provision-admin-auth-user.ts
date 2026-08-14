import "server-only";
import { getAdminEmail, getSupabaseAdminAuthConfig } from "../../infrastructure/config/env";
import { adminAuthProvisioningService } from "../../composition/admin-auth.composition";

function isLoopback(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function printTarget(mode: "local" | "production", hostname: string, email: string) {
  console.info(`environment: ${mode}`);

  console.info(`supabase hostname: ${hostname}`);

  console.info(`approved email: ${email}`);

}

async function main() {
  const production = process.argv.includes("--production");

  const confirmed = process.argv.includes("--confirm-production");

  const config = getSupabaseAdminAuthConfig();

  const hostname = new URL(config.url).hostname;

  const email = getAdminEmail();

  const mode = production ? "production" : "local";

  printTarget(mode, hostname, email);

  if ((!production && !isLoopback(hostname)) || (production && (!confirmed || isLoopback(hostname)))) {
    process.exitCode = 1;

    return;
  }

  try {
    const result = await adminAuthProvisioningService.provisionApprovedAdmin();

    console.info(result.status);
  } catch {
    process.exitCode = 1;
  }
}

void main();
