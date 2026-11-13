import { createServer } from "node:http";
import { once } from "node:events";
import assert from "node:assert/strict";
import test from "node:test";
import { assertDisposableApp, validateDisposableTarget } from "./disposable-target";
import { requirePassingTap } from "./disposable-postgres";

const identity = {
  id: `freemancodz_fixture_${"a".repeat(24)}`,
  port: "49152",
  password: "b".repeat(48),
};

const synthetic = `postgresql://fixture_admin:${identity.password}@127.0.0.1:${identity.port}/${identity.id}`;

test("disposable target syntax rejects unknown/shared/malformed locations before connection", () => {
  assert.equal(validateDisposableTarget(synthetic, identity), synthetic);
  for (const value of [
    undefined,
    "invalid",
    synthetic.replace("127.0.0.1", "shared.invalid"),
    synthetic.replace("127.0.0.1", "localhost"),
    synthetic.replace("49152", "5432"),
    synthetic.replace(identity.id, "production"),
    synthetic + "?options=unsafe",
    synthetic + "#fragment",
  ]) {
    assert.throws(
      () => validateDisposableTarget(value, identity),
      /rejected before database access/,
    );
  }

  assert.throws(() => validateDisposableTarget(synthetic, {}), /rejected before database access/);
});

test("required TAP evidence rejects zero, partial, duplicate, skipped, failed and cancelled stages", () => {
  const passed = "# tests 2\n# pass 2\n# fail 0\n# skipped 0\n# cancelled 0\n";

  assert.equal(requirePassingTap(passed).tests, 2);
  for (const value of [
    "",
    passed.replace("# pass 2\n", ""),
    passed + "# tests 2\n",
    passed.replace("tests 2", "tests 0"),
    passed.replace("pass 2", "pass 1"),
    passed.replace("fail 0", "fail 1"),
    passed.replace("skipped 0", "skipped 1"),
    passed.replace("cancelled 0", "cancelled 1"),
  ]) {
    assert.throws(() => requirePassingTap(value));
  }
});

test("browser target guard verifies a local fixture marker and rejects redirects or wrong identity", async () => {
  const previousId = process.env.FREEMANCODZ_FIXTURE_ID;

  const previousOrigin = process.env.FREEMANCODZ_FIXTURE_APP_ORIGIN;

  process.env.FREEMANCODZ_FIXTURE_ID = identity.id;
  let mode = "valid";

  const server = createServer((_request, response) => {
    if (mode === "redirect") {
      response.writeHead(302, { location: "/images/__engineering_fixture.json" });
      response.end();
    } else {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ fixture: mode === "valid" ? identity.id : "wrong" }));
    }
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;

  process.env.FREEMANCODZ_FIXTURE_APP_ORIGIN = origin;
  try {
    await assertDisposableApp(origin);
    await assertDisposableApp(origin, origin);
    await assert.rejects(
      assertDisposableApp(origin, "http://127.0.0.1:1"),
      /rejected before browser access/,
    );
    await assert.rejects(
      assertDisposableApp("https://shared.invalid"),
      /rejected before browser access/,
    );
    mode = "wrong";
    await assert.rejects(assertDisposableApp(origin), /identity could not be verified/);
    mode = "redirect";
    await assert.rejects(assertDisposableApp(origin), /identity could not be verified/);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    if (previousId === undefined) {
      delete process.env.FREEMANCODZ_FIXTURE_ID;
    } else {
      process.env.FREEMANCODZ_FIXTURE_ID = previousId;
    }

    if (previousOrigin === undefined) {
      delete process.env.FREEMANCODZ_FIXTURE_APP_ORIGIN;
    } else {
      process.env.FREEMANCODZ_FIXTURE_APP_ORIGIN = previousOrigin;
    }
  }
});
