export function requireProductionConfirmation(): void {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for production administration.");
  }

  let target: URL;

  try {
    target = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid database URL.");
  }

  const databaseName = target.pathname.replace(/^\//, "") || "(default)";
  console.log(`Production database target: ${target.hostname}/${databaseName}`);

  if (!process.argv.includes("--confirm-production")) {
    throw new Error(
      "Production administration requires the --confirm-production flag.",
    );
  }
}
