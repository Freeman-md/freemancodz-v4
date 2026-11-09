import "server-only";

export type PortfolioEnvironment = "development" | "production";

export class PortfolioTargetError extends Error {}

const supportedOptions = new Set([
  "sslmode",
  "sslaccept",
  "connect_timeout",
  "pgbouncer",
  "schema",
]);

function databaseIdentity(connection: string | undefined) {
  try {
    if (!connection) {
      throw new Error();
    }

    const url = new URL(connection);

    const user = decodeURIComponent(url.username);

    const database = decodeURIComponent(url.pathname.slice(1));

    const options = [...url.searchParams.keys()];

    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname ||
      !url.port ||
      !/^[a-zA-Z0-9_.-]+$/.test(user) ||
      !/^[a-zA-Z0-9_.-]+$/.test(database) ||
      url.hash ||
      options.some((key) => !supportedOptions.has(key)) ||
      new Set(options).size !== options.length ||
      (url.searchParams.has("schema") && url.searchParams.get("schema") !== "public")
    ) {
      throw new Error();
    }

    return { address: `${url.hostname.toLowerCase()}:${url.port}/${database}`, user };
  } catch {
    throw new PortfolioTargetError(
      "Missing or ambiguous portfolio DATABASE_URL. Include the database port explicitly.",
    );
  }
}

export function verifyPortfolioTarget(
  environment: PortfolioEnvironment,
  configuration: Record<string, string | undefined>,
  inherited: Record<string, string | undefined>,
) {
  const connection = configuration.DATABASE_URL;

  const target = databaseIdentity(connection);

  if (
    !connection ||
    configuration.PORTFOLIO_SEED_ENVIRONMENT !== environment ||
    target.address !== configuration.PORTFOLIO_SEED_DATABASE ||
    target.user !== configuration.PORTFOLIO_SEED_USER ||
    inherited.PGOPTIONS ||
    configuration.PGOPTIONS
  ) {
    throw new PortfolioTargetError(
      `The configured database does not match the expected ${environment} portfolio target.`,
    );
  }

  if (inherited.DATABASE_URL !== undefined) {
    const inheritedTarget = databaseIdentity(inherited.DATABASE_URL);

    if (inheritedTarget.address !== target.address || inheritedTarget.user !== target.user) {
      throw new PortfolioTargetError(
        "Inherited DATABASE_URL points to a different portfolio target.",
      );
    }
  }

  return { connection, label: environment };
}

export async function loadPortfolioTarget(environment: PortfolioEnvironment) {
  const { config } = await import("dotenv");

  const path = environment === "production" ? ".env.production.local" : ".env";

  const configuration: Record<string, string> = {};

  const result = config({ path, processEnv: configuration, quiet: true });

  if (result.error) {
    throw new PortfolioTargetError(
      `The ${environment} portfolio database configuration could not be loaded.`,
    );
  }

  return verifyPortfolioTarget(environment, configuration, process.env);
}
