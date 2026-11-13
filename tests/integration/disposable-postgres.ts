import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { Client } from "pg";
import { applyPrismaMigration, portfolioSeedFixture } from "./apply-prisma-migration";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPortfolioSeedRepository } from "@/modules/portfolio/repositories/portfolio-seed.repository";
import { PortfolioSeedService } from "@/modules/portfolio/seed.service";

export const POSTGRES_IMAGE =
  "pgvector/pgvector:0.8.1-pg15@sha256:94aee7e88f98125114657cab98e28c5dfa8dd517a6bf83fd98b503439f1e3de6";

export function systemEnvironment(): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    TMPDIR: process.env.TMPDIR,
    LANG: "C.UTF-8",
    NODE_ENV: "development",
  };
}

export type DisposableFixture = {
  environment: NodeJS.ProcessEnv;
  redact: (text: string) => string;
  prepare: () => Promise<number>;
  run: (
    command: string,
    args: string[],
    options?: { cwd?: string; env?: NodeJS.ProcessEnv; timeout?: number },
  ) => Promise<{ code: number; output: string }>;
};

export async function withDisposablePostgres<T>(
  runWithFixture: (fixture: DisposableFixture) => Promise<T>,
) {
  const id = `freemancodz_fixture_${randomBytes(12).toString("hex")}`;

  const password = randomBytes(24).toString("hex");

  const socket =
    process.platform === "darwin"
      ? join(homedir(), ".docker/run/docker.sock")
      : "/var/run/docker.sock";

  const dockerEnvironment = {
    ...systemEnvironment(),
    POSTGRES_USER: "fixture_admin",
    POSTGRES_PASSWORD: password,
    POSTGRES_DB: id,
  };

  const redact = (text: string) =>
    text
      .replaceAll(password, "[fixture credential redacted]")
      .replace(/postgres(?:ql)?:\/\/[^\s'"<>]+/gi, "[database URL redacted]");

  const docker = (args: string[]) => {
    try {
      return execFileSync("docker", ["--host", `unix://${socket}`, ...args], {
        env: dockerEnvironment,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
    } catch {
      throw new Error(
        "Local Docker fixture command failed; no credential-bearing command output is exposed.",
      );
    }
  };

  let created = false;

  let removed = false;

  let volumeName: string | undefined;

  const cleanup = () => {
    if (created && !removed) {
      if (
        docker(["inspect", "--format", '{{index .Config.Labels "freemancodz.fixture"}}', id]) !== id
      ) {
        throw new Error("Refusing cleanup of a container without the matching fixture identity.");
      }

      docker(["rm", "-fv", id]);
      if (
        docker(["ps", "-aq", "--filter", `name=^/${id}$`]) ||
        (volumeName && docker(["volume", "ls", "-q", "--filter", `name=^${volumeName}$`]))
      ) {
        throw new Error("Fixture cleanup could not be verified.");
      }

      removed = true;
      console.log("Disposable PostgreSQL container and its fresh anonymous volume removed.");
    }
  };

  const interrupt = () => {
    try {
      cleanup();
    } finally {
      process.exit(130);
    }
  };

  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  try {
    docker([
      "run",
      "--detach",
      "--name",
      id,
      "--label",
      `freemancodz.fixture=${id}`,
      "--pull",
      "never",
      "--publish",
      "127.0.0.1::5432",
      "--env",
      "POSTGRES_USER",
      "--env",
      "POSTGRES_PASSWORD",
      "--env",
      "POSTGRES_DB",
      POSTGRES_IMAGE,
      "-c",
      `freemancodz.fixture_id=${id}`,
    ]);
    created = true;
    const { ports, mounts, binds, label } = JSON.parse(
      docker([
        "inspect",
        "--format",
        '{"ports":{{json .NetworkSettings.Ports}},"mounts":{{json .Mounts}},"binds":{{json .HostConfig.Binds}},"label":{{json (index .Config.Labels "freemancodz.fixture")}}}',
        id,
      ]),
    ) as {
      ports: Record<string, { HostIp: string; HostPort: string }[]>;
      mounts: { Type: string; Name: string; Destination: string }[];
      binds: unknown;
      label: string;
    };

    const binding = ports["5432/tcp"];

    if (
      label !== id ||
      binds !== null ||
      binding?.length !== 1 ||
      binding[0].HostIp !== "127.0.0.1" ||
      Number(binding[0].HostPort) < 1024 ||
      binding[0].HostPort === "5432" ||
      mounts.length !== 1 ||
      mounts[0].Type !== "volume" ||
      !/^[a-f0-9]{64}$/.test(mounts[0].Name) ||
      mounts[0].Destination !== "/var/lib/postgresql/data"
    ) {
      throw new Error("Fixture isolation validation failed before database access.");
    }

    volumeName = mounts[0].Name;
    const port = binding[0].HostPort;

    const connection = `postgresql://fixture_admin:${password}@127.0.0.1:${port}/${id}`;

    let ready = false;

    for (let attempt = 0; attempt < 100; attempt++) {
      const client = new Client({ connectionString: connection, connectionTimeoutMillis: 500 });

      try {
        await client.connect();
        await client.query("SELECT 1");
        ready = true;
      } catch {
        /* Startup is bounded below; no raw driver errors are logged. */
      } finally {
        await client.end().catch(() => undefined);
      }

      if (ready) {
        break;
      }

      await delay(200);
    }

    if (!ready) {
      throw new Error("Disposable PostgreSQL did not become ready.");
    }

    const admin = new Client({
      connectionString: connection,
      connectionTimeoutMillis: 1000,
      query_timeout: 2000,
    });

    await admin.connect();
    try {
      const { rows } = await admin.query<{ version: string; fixture: string }>(
        "SELECT current_setting('server_version_num') AS version, current_setting('freemancodz.fixture_id') AS fixture",
      );

      if (!rows[0]?.version.startsWith("15") || rows[0].fixture !== id) {
        throw new Error("Unexpected fixture database identity/version.");
      }

      await admin.query(
        "CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;",
      );
    } finally {
      await admin.end();
    }

    const environment: NodeJS.ProcessEnv = {
      ...systemEnvironment(),
      NODE_ENV: "development",
      DATABASE_URL: connection,
      PORTFOLIO_TEST_DATABASE_URL: connection,
      WORKFLOW_TEST_DATABASE_URL: connection,
      FREEMANCODZ_FIXTURE_ID: id,
      FREEMANCODZ_FIXTURE_PORT: port,
      FREEMANCODZ_FIXTURE_PASSWORD: password,
      RATE_LIMIT_HMAC_SECRET: "synthetic-rate-limit-fixture-value-000000000000",
      WORKFLOW_RUNNER_SECRET: "disposable-m28-workflow-runner-test",
      OPENAI_API_KEY: "synthetic-unused-provider-key",
      NEXT_TELEMETRY_DISABLED: "1",
    };

    const run: DisposableFixture["run"] = (command, args, options = {}) =>
      new Promise((resolve, reject) => {
        const child = spawn(command, args, {
          cwd: options.cwd,
          env: options.env ?? environment,
          stdio: ["ignore", "pipe", "pipe"],
        });

        let output = "";

        const timer = setTimeout(() => child.kill("SIGKILL"), options.timeout ?? 300_000);

        child.stdout.on("data", (chunk) => {
          output += chunk;
        });
        child.stderr.on("data", (chunk) => {
          output += chunk;
        });
        child.on("error", () => {
          clearTimeout(timer);
          reject(new Error("Fixture child process could not start."));
        });
        child.on("close", (code) => {
          clearTimeout(timer);
          resolve({ code: code ?? 1, output: redact(output) });
        });
      });

    const prepare = async () => {
      const database = new Client({ connectionString: connection });

      await database.connect();
      const migrations = (await readdir("prisma/migrations"))
        .filter((name) => /^\d+_/.test(name))
        .sort();

      try {
        for (const migration of migrations) {
          await applyPrismaMigration(database, migration, connection);
        }
      } finally {
        await database.end();
      }

      const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: connection }) });

      try {
        await new PortfolioSeedService(new PrismaPortfolioSeedRepository(prisma)).run(
          portfolioSeedFixture,
          true,
        );
      } finally {
        await prisma.$disconnect();
      }

      return migrations.length;
    };

    console.log(
      "Disposable PostgreSQL 15 ready: loopback publication, fresh anonymous volume, no host binds, three NOLOGIN roles, server identity verified.",
    );

    return await runWithFixture({ environment, redact, prepare, run });
  } catch (error) {
    throw new Error(redact(error instanceof Error ? error.message : "Disposable fixture failed."));
  } finally {
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
    cleanup();
  }
}

export function requirePassingTap(output: string) {
  const summary: Record<string, number> = {};

  for (const field of ["tests", "pass", "fail", "skipped", "cancelled"]) {
    const matches = [...output.matchAll(new RegExp(`^# ${field} (\\d+)$`, "gm"))];

    if (matches.length !== 1) {
      throw new Error("Missing, duplicate or incomplete root TAP summary.");
    }

    summary[field] = Number(matches[0][1]);
  }

  if (
    summary.tests < 1 ||
    summary.pass !== summary.tests ||
    summary.fail !== 0 ||
    summary.skipped !== 0 ||
    summary.cancelled !== 0
  ) {
    throw new Error(
      "Required tests did not all pass: zero tests, failures, skips or cancellation detected.",
    );
  }

  return summary;
}
