import { refreshProfessionalProfile } from "../../../prisma/refresh-professional-profile";
import { prisma } from "@/infrastructure/database/prisma";
import { getDatabaseUrl } from "@/infrastructure/config/env";
import { requireProductionConfirmation } from "../helpers/require-production-confirmation";

async function main() {
  const production = process.argv.includes("--production");

  const local = ["localhost", "127.0.0.1", "[::1]"].includes(new URL(getDatabaseUrl()).hostname);

  if (production) {
    requireProductionConfirmation();
  }

  if (production === local) {
    throw new Error("Database target does not match the selected mode.");
  }

  try {
    console.info("Professional profile refreshed:", await refreshProfessionalProfile(prisma));
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch(() => {
  console.error("Professional profile refresh failed; no partial content changes were saved.");
  process.exitCode = 1;
});
