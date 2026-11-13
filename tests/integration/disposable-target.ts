import { Client } from "pg";

export type FixtureIdentity = { id?: string; port?: string; password?: string };

export function validateDisposableTarget(value: string | undefined, identity: FixtureIdentity) {
  const rejected = () => new Error("Disposable fixture target rejected before database access.");

  if (
    !value ||
    !/^freemancodz_fixture_[a-f0-9]{24}$/.test(identity.id ?? "") ||
    !/^\d+$/.test(identity.port ?? "") ||
    !/^[a-f0-9]{48}$/.test(identity.password ?? "")
  ) {
    throw rejected();
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw rejected();
  }

  if (
    url.protocol !== "postgresql:" ||
    url.hostname !== "127.0.0.1" ||
    url.port !== identity.port ||
    Number(url.port) < 1024 ||
    Number(url.port) > 65535 ||
    url.port === "5432" ||
    url.username !== "fixture_admin" ||
    url.password !== identity.password ||
    url.pathname !== `/${identity.id}` ||
    url.search ||
    url.hash
  ) {
    throw rejected();
  }

  return value;
}

export async function assertDisposableTarget(value: string | undefined) {
  const identity = {
    id: process.env.FREEMANCODZ_FIXTURE_ID,
    port: process.env.FREEMANCODZ_FIXTURE_PORT,
    password: process.env.FREEMANCODZ_FIXTURE_PASSWORD,
  };

  const connectionString = validateDisposableTarget(value, identity);

  const client = new Client({ connectionString, connectionTimeoutMillis: 1000 });

  try {
    await client.connect();
    const { rows } = await client.query<{ fixture: string; database: string; role: string }>(
      "SELECT current_setting('freemancodz.fixture_id', true) AS fixture, current_database() AS database, current_user AS role",
    );

    if (
      rows[0]?.fixture !== identity.id ||
      rows[0]?.database !== identity.id ||
      rows[0]?.role !== "fixture_admin"
    ) {
      throw new Error("Unexpected fixture identity");
    }
  } catch {
    // Never include an assertion's actual URL, driver options, or raw connection error.
    throw new Error(
      "Disposable fixture server identity could not be verified; no writes authorised.",
    );
  } finally {
    await client.end().catch(() => undefined);
  }

  return connectionString;
}

export async function assertDisposableApp(
  value: string | undefined,
  expected = process.env.FREEMANCODZ_FIXTURE_APP_ORIGIN,
) {
  const id = process.env.FREEMANCODZ_FIXTURE_ID;

  let url: URL;

  try {
    url = new URL(value ?? "");
  } catch {
    throw new Error("Disposable app target is missing or invalid.");
  }

  if (
    !/^freemancodz_fixture_[a-f0-9]{24}$/.test(id ?? "") ||
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    !url.port ||
    url.origin !== expected ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Disposable app target rejected before browser access.");
  }

  try {
    const response = await fetch(new URL("/images/__engineering_fixture.json", url), {
      redirect: "error",
      signal: AbortSignal.timeout(2000),
    });

    const marker: unknown = await response.json();

    if (
      !response.ok ||
      typeof marker !== "object" ||
      marker === null ||
      !("fixture" in marker) ||
      marker.fixture !== id
    ) {
      throw new Error("Mismatched marker");
    }
  } catch {
    throw new Error("Disposable app identity could not be verified; no browser writes authorised.");
  }
}
