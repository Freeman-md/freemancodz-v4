# Canonical verification contract

Task 11 implements existing accepted ARC/STD verification obligations (ADR-0001 and ADR-0002; APPROVAL-001/002). It adds no architectural decision, exception, release approval or hosted gate. Architecture and formatting results remain strict non-regression checks with the documented legacy debt, not full compliance.

## Commands and prerequisites

`npm run verify` is the full local quality gate. `npm run verify:acceptance` independently exercises the implemented critical browser workflows. Neither command implies release readiness. Underlying package commands remain available for diagnosis; raw `npm test` can skip database tests and is not this gate.

Use the installed dependencies from the lockfile. The repository README requires Node 22.13 or newer in the 22.x series; the preflight also checks the installed packages' engine requirements. This implementation was exercised on Node 22.17.0. Git must be available to establish the snapshot. A clean installation can use the existing lifecycle, with an explicitly synthetic, non-connecting URL so Prisma configuration never loads an environment file:

```sh
DATABASE_URL=postgresql://synthetic@127.0.0.1:1/verification_no_connection npm ci
```

The existing postinstall generates Prisma. Quality verification validates and generates again as recorded stages; it does not assume the generated client was committed. Generation writes ignored generated files, not authored application code. Acceptance requires that client to exist. `npm ci --ignore-scripts` has not been proved in this setup and is not the documented installation contract.

Docker must be running through the local Unix socket (Docker Desktop on macOS or `/var/run/docker.sock` on Linux), and this exact image must already be installed:

```text
pgvector/pgvector:0.8.1-pg15@sha256:94aee7e88f98125114657cab98e28c5dfa8dd517a6bf83fd98b503439f1e3de6
```

The runner does not pull images, accept a supplied database URL or inherit ambient provider credentials. It creates one uniquely identified PostgreSQL 15 container, generated password, ephemeral loopback publication and fresh anonymous volume, verifies identity/version before role writes, applies all committed migrations and fixture seed, and removes only its own container/volume. No host binds or shared database targets are accepted. See [integration safety and risk coverage](INTEGRATION_VERIFICATION.md).

The staged production build uses a fresh `/tmp` directory with an explicit safe file allowlist and a link to installed dependencies. It runs Prisma generation and `next build --webpack`; production source is unchanged. The installed Next 16 documentation supports this bundler flag. This verifies a production build through webpack, not Turbopack. Google Fonts compilation currently needs network access. Missing network, space, image or runtime prerequisites remain failures/blockers; they are not skipped.

Browser acceptance additionally needs a compatible Playwright module and installed Chromium/WebKit engines. Default installed locations work where available; otherwise set only the documented non-secret path variables `PLAYWRIGHT_MODULE`, `CHROMIUM_EXECUTABLE`, `WEBKIT_EXECUTABLE`. [Browser preflight](setup/evidence/browser-preflight.md) records this machine's tested paths. The browser app uses the existing Meeting provider fixture in the isolated copy and a real Next production HTTP server. App-origin and marker guards prevent posting to arbitrary targets.

## Required stages

The authoritative executable stage definitions are in `scripts/engineering/verification-evidence.mjs`; there are no skip flags or optional stages within either command.

| Quality stage ID   | Executed operation                                                  | Success requirement                                                                           |
| ------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `prerequisites`    | Node/package engines, local Docker availability, exact cached image | All present; otherwise BLOCKED                                                                |
| `prisma-validate`  | `npm run prisma:validate`                                           | Exit 0 with synthetic explicit URL; no DB connection                                          |
| `prisma-generate`  | `npm run prisma:generate`                                           | Exit 0 with synthetic explicit URL                                                            |
| `architecture`     | `npm run check:architecture`                                        | Exit 0; no new or stale exact source-debt entries                                             |
| `format`           | `npm run check:format`                                              | Exit 0; safe authored candidates, no new or stale format-debt entries                         |
| `lint`             | `npm run lint`                                                      | Exit 0 with existing rules unchanged                                                          |
| `types`            | `npm run typecheck -- --incremental false`                          | Exit 0; no incremental cache write                                                            |
| `harness`          | Load the existing helpers through TSX                               | Helpers load successfully; internal loader errors are FAIL                                    |
| `unit`             | `npm run test:unit` with explicit TAP reporter                      | Positive root test count, all pass, zero failures/skips/cancellations                         |
| `tooling`          | `npm run test:engineering` with explicit TAP reporter               | Same strict count requirement; includes checker and evidence harness regressions              |
| `database-fixture` | Shared `withDisposablePostgres` provisioning and identity checks    | Verified owned disposable target                                                              |
| `migrations`       | Shared fixture `prepare()`                                          | Every committed Prisma migration plus fixture seed succeeds                                   |
| `database`         | Shared `runDatabaseSuite(fixture)`                                  | Every discovered integration suite, strict TAP totals and expected unsafe-target rejection    |
| `production-build` | Shared `runStagedWorkflow(fixture, "build-only")`                   | Safe production staging, staged Prisma generation, unmodified-source webpack build all exit 0 |
| `fixture-cleanup`  | Shared fixture finalizer                                            | Exact owned container and anonymous volume confirmed removed                                  |
| `snapshot`         | Recompute safe worktree identity and HEAD                           | Identical to start snapshot                                                                   |

Database execution uses `node --conditions=react-server --import tsx --test --test-reporter=tap --test-concurrency=1`, the fixture guard suite, and all `.test.ts` files under integration assistant/rate-limit/workflow/portfolio. This includes the portfolio database suite omitted by raw `npm test`. The unsafe-target control intentionally returns nonzero before database access and is asserted as a negative control; it is not a failing required product test disguised as success.

Acceptance has eight required stages: `prerequisites`, `harness`, `browser-prerequisites`, `database-fixture`, `migrations`, `browser`, `fixture-cleanup`, `snapshot`. Its browser stage runs the same staged generation/build, then explicit TAP workflow/status and assistant suites. The existing tests cover actual booking approval, persistence/reload, status privacy and assistant behavior across Chromium and WebKit. Each TAP invocation must have one complete root summary, nonzero tests and no failures/skips/cancellations before counts are aggregated. Optional empty/services plugin scenarios remain outside this executed gate; their write guards remain enforced.

`npm run test:browser:workflow -- --build-only` and `-- --browser-only` preserve independently runnable diagnostics. The canonical commands call the same exported helpers in process to share one database; the report names those operations rather than pretending a second CLI process was executed. Function stages use normalized exit 0 on successful completion; child failures retain their actual observable exit code. Detailed staged command exits appear in the safe terminal log.

The catalogue's final-unit bestseller checkout, historical order snapshot and stale Admin stock cases are **not applicable**: this repository has no ecommerce implementation or those tests. No failing test has been removed, weakened or manufactured. Acceptance reports the actual current PASS/FAIL/BLOCKED result of this repository's implemented scope.

## Evidence and exit contract

Both commands print each stage's ID, command and result, followed by a concise summary. They write version-1 JSON outside the checkout by default in a newly created temporary directory. An explicit, previously unused path is supported for CI/artifact collection:

```sh
npm run verify -- --report "$RUNNER_TEMP/quality.json"
npm run verify:acceptance -- --report "$RUNNER_TEMP/acceptance.json"
npm run verify:evidence -- quality "$RUNNER_TEMP/quality.json"
npm run verify:evidence -- acceptance "$RUNNER_TEMP/acceptance.json"
```

Use a fresh path for each run. The parent directory must exist. In-tree locations, misleading `..prefix` names and final-component symlinks are rejected. Writes are exclusive, with owner-only permissions; existing evidence is never overwritten. No DSN, generated password or provider credential is retained. Child environments are constructed from a small system allowlist and synthetic fixture configuration, not inherited secret values. Logs are redacted before output.

Each report contains `version`, `kind`, start/end timestamps, Node/platform/architecture, safe input identity, disposable fixture identity/image/migration count/cleanup result, ordered `stages`, `overall` and a null-or-diagnostic `error` for unexpected orchestration failures. Each stage records `id`, the fixed `command`, `status`, `exitCode`, `counts` and `reason`. Counts contain `tests`, `pass`, `fail`, `skipped`, `cancelled`; non-test stages use null. Exit null means no observable child exit, not exit 0. NOT RUN stages retain an explicit reason. The fixture identifier is non-secret; credentials and connection strings are absent.

PASS requires every required stage to pass. Any failed stage makes overall FAIL/nonzero; missing prerequisites or incomplete required stages make BLOCKED/nonzero unless an observed failure already requires FAIL. Independent stages continue after static-check failures to expose useful diagnostics; dependent stages remain NOT RUN after unmet prerequisites. Required test transcripts with missing/duplicate root fields, zero tests, skipped/cancelled tests or inconsistent totals fail closed even when the child returned 0. Unexpected orchestration or report-write errors return nonzero. No baseline updates or suppression changes occur.

`verify:evidence` requires the exact version/kind, ordered required stage IDs and commands, PASS/exit 0 for all stages, complete positive counts, valid fixture identity, exact pinned image, integer migration count matching the current input manifest, verified cleanup, and matching HEAD plus content identity. Missing, malformed, failed, incomplete or stale evidence returns nonzero. It is a local consistency check, not a cryptographic attestation: independent review must inspect the real execution and trusted CI provenance.

Identity enumerates Git-tracked plus untracked nonignored safe inputs before reading contents. It hashes explicit recognized root configuration/docs, supported authored source/test/tooling/Prisma/docs/workflow files, public asset types and the canonical local architecture skill. Secret-bearing names, arbitrary root configs such as `.npmrc`/`.netrc`, private key/certificate material, symlinks, generated/build/dependency/cache outputs are excluded or rejected before content reads. Each included path and SHA256 is retained; the aggregate hashes sorted `path + NUL + SHA256 + newline`, with current HEAD and migration count. Deleted files disappear from the snapshot, so deletion changes its identity.

Operational setup status and `docs/engineering/setup/` receipts/prompt snapshots are excluded from this freshness digest to avoid invalidating an immutable run when its evidence is recorded. Ordinary authored docs remain in the formatter scope; accepted architecture/ADRs/standards, the verification contract and package commands remain identity inputs. This is a bounded quality-input snapshot, **not** the full review-diff identity. Task 15 must additionally bind the entire reviewed change set, index, unstaged/untracked state and future hook/skill inputs without reading secret contents. Changes to that broader scope require reviewer assessment even when this quality digest matches.

Completed command outcomes, external report/log paths, counts and hashes are retained in [Task 11 execution receipts](setup/evidence/task-11-results.md) and the setup review ledger. Historical Task 10 integration/build/browser results establish coverage but cannot substitute for the canonical command's current snapshot. Report presence alone is not PASS: consume it through `verify:evidence` and independently inspect the stage evidence.

## Release decision and remaining limits

Release readiness is a separate owner decision, currently **BLOCKED**. Before a release, the reviewer and owner must establish:

1. Current matching quality PASS and relevant acceptance PASS, plus any additional acceptance obligations of the actual release contract. Unknown or unrun requirements remain BLOCKED.
2. Independent review of the exact change set, accepted ADR/exception scope, unresolved debt and meaningful remaining risks. A non-regression pass does not waive the 13 source findings or nine remaining format entries recorded after Task 10.
3. Target-environment configuration and target identity, migration/seed rollout and recovery evidence, provider credentials/permissions and live integration behavior where the release depends on them. Synthetic fixture success cannot prove Google Calendar, Resend, OpenAI or hosted Supabase behavior.
4. Applicable hosted checks, deployment/preview evidence and post-deployment smoke results tied to the intended revision. Local scripts do not establish required merge gates or a deployed release.
5. Explicit owner merge and release authorization, recorded separately from architecture/standards approvals and test results. No automatic deployment or approval is performed here.

Task 12 must wire the same `npm run verify` command into automation, retain its report and validate matching evidence. It must not create a weaker second pipeline. Hosted enforcement, milestone integration and final lifecycle trials remain later tasks, subject to independent review and the catalogue's approval contract.
