import "server-only";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  assertProductionPortfolioIsUninitialised,
  bootstrapMedia,
  resetPortfolio,
  seedPortfolio,
  verifyPortfolio,
} from "../../../../prisma/portfolio-bootstrap";
import { getDatabaseUrl } from "../../infrastructure/config/env";
import { prisma } from "../../infrastructure/database/prisma";
import { createSupabaseStorageClient } from "../../infrastructure/supabase/supabase-storage.client";
import { SupabaseStorageProvider } from "../../modules/portfolio/providers/supabase-storage.provider";
import { parsePortfolioBootstrapArguments } from "./bootstrap-portfolio.arguments";

async function main() {
  const { production } = parsePortfolioBootstrapArguments(process.argv.slice(2));

  const databaseTarget = new URL(getDatabaseUrl());

  const storageTarget = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not configured";

  console.info(
    `Portfolio bootstrap mode: ${production ? "PRODUCTION (one-time, non-overwriting)" : "LOCAL (portfolio-only reset)"}`,
  );
  console.info(
    `Database target: ${databaseTarget.hostname}:${databaseTarget.port || "5432"}/${databaseTarget.pathname.slice(1)}`,
  );
  console.info(`Storage target: ${storageTarget}/storage/v1/object/public/portfolio-media`);

  const sourceDirectory = process.env.PORTFOLIO_MEDIA_SOURCE_DIR;

  const storage = new SupabaseStorageProvider(createSupabaseStorageClient());

  await bootstrapMedia(storage, async (filename) => {
    if (!sourceDirectory) {
      throw new Error(
        `Missing portfolio binary ${filename}. Set PORTFOLIO_MEDIA_SOURCE_DIR to the approved six source files.`,
      );
    }

    return readFile(resolve(sourceDirectory, filename));
  });

  if (production) {
    await assertProductionPortfolioIsUninitialised(prisma);
  }

  if (!production) {
    await resetPortfolio(prisma);
  }

  await seedPortfolio(prisma, storage);
  console.info("Portfolio bootstrap verified:", await verifyPortfolio(prisma));
  await prisma.$disconnect();
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Portfolio bootstrap failed.");
  process.exitCode = 1;
});
