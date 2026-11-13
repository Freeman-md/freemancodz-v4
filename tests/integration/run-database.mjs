import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { withDisposablePostgres, requirePassingTap } from "./disposable-postgres.ts";

export async function runDatabaseSuite(fixture) {
  const files = ["tests/integration/disposable-fixture.test.ts"];

  for (const area of ["assistant", "rate-limit", "workflow", "portfolio"]) {
    for (const file of (await readdir(`tests/integration/${area}`))
      .filter((name) => name.endsWith(".test.ts"))
      .sort()) {
      files.push(`tests/integration/${area}/${file}`);
    }
  }

  const result = await fixture.run(process.execPath, [
    "--conditions=react-server",
    "--import",
    "tsx",
    "--test",
    "--test-reporter=tap",
    "--test-concurrency=1",
    ...files,
  ]);

  process.stdout.write(result.output);
  if (result.code !== 0) {
    throw Object.assign(new Error(`Database suite failed (exit ${result.code}).`), {
      exitCode: result.code,
    });
  }

  const summary = requirePassingTap(result.output);

  console.log(
    `Required database/integration tests: ${summary.pass}/${summary.tests} passed; zero skips or cancellations.`,
  );
  const negative = await fixture.run(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      "--test",
      "--test-reporter=tap",
      "tests/integration/workflow/contact-database.test.ts",
    ],
    {
      env: {
        ...fixture.environment,
        PORTFOLIO_TEST_DATABASE_URL: "postgresql://synthetic@shared.invalid/production",
      },
    },
  );

  if (negative.code === 0 || !negative.output.includes("rejected before database access")) {
    throw new Error("Unsafe-target negative control failed to reject before database access.");
  }

  console.log(
    `Unsafe-target raw-suite control rejected before database access (expected exit ${negative.code}).`,
  );

  return { code: result.code, counts: summary };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await withDisposablePostgres(async (fixture) => {
      console.log(`Applied ${await fixture.prepare()} committed migrations and fixture seed.`);
      await runDatabaseSuite(fixture);
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
