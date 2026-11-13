# R14-01 evidence validation correction

The independent Task 14 trial exposed three invalid JSON metadata shapes that the Task 11/12 parser accepted. [Gate validation](../../GATE_VALIDATION.md) preserves the original false positives and their scope. The existing requirement to reject malformed evidence governs this correction.

Executor `/root/setup_execution` changed the evidence parser and focused regressions. The version-1 producer format is unchanged. The validator now requires canonical ISO timestamp strings in chronological order, typed runtime fields using the supported Node range, and a string-only fixture ID before format checks. Non-record values fail validation. Existing identity, stage, exit, count, migration and cleanup checks remain in effect.

| Corrected artifact                              | SHA-256                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `scripts/engineering/verification-evidence.mjs` | `2e06fa22a5a8910efa2b3c35f57a9bc76d2570eaabcd9ef315eafe84dc02e11b` |
| `tests/engineering/verification.test.mjs`       | `43e3d62b602210de7b72dccba5b3798dca3e1ca0a136c1923a530de77ed94ba1` |

The 11 focused tests passed. Repeating the actual parser CLI on the same candidate identity accepted the matching positive report and rejected all 12 invalid cases with exit 1. This comparison isolates the parser change. It does not convert the historical candidate's report into current whole-checkout verification.

- Original case directory: `/private/tmp/freemancodz-task14-evidence-C3CsmL`. `results.json` SHA-256 `f67f66f4f37b8b083742373d2bb9a639d81ffa5cf88c611e3a9163ecea3786a6`. Fixture-ID result SHA-256 `514cdad9f776c67ddf4987afbe6d23e38369f2cfe7a8ca7919e3a191a55251d0`.
- Corrected case directory: `/private/tmp/freemancodz-task14-evidence-teafUY`. `results.json` SHA-256 `e7f74856f224a4913e4d4d20631dc09af90ad44bc871301015e373097332d2f9`. Fixture-ID result SHA-256 `3b36705efe360864eed31525831a273ee669756d21b6c190d3eb3a79f9b4fb5a`.
- Focused log `/private/tmp/freemancodz-r14-correction-focused-final.log` SHA-256 `0c604e8f927c9d1541a61075bd322c58b8fb90a7fbca6b7435fb3cafcc8b534d`.

## Fresh corrected quality execution

The corrected isolated checkout `/private/tmp/freemancodz-r14-correction-Oju5ps/checkout` is at `413957e395948e3e48f20e53625f23ddfddf9e1b`. Its 288-input digest is `dbcca4fc9675bd0f5c7ce92f0ccb8146fe53b3c1273c8f2659ef3c2246b58674`. The checkout uses the original committed chat constants and version-matched workspace dependencies under the same bounded local setup as Task 12.

`npm run verify` and its matching evidence command each exited **0**. All 16 stages passed. The run executed 39 unit, 48 tooling and 65 database/integration tests with zero skips, replayed 23 migrations and verified the production webpack build and fixture cleanup.

- Report `/private/tmp/freemancodz-r14-correction-Oju5ps/evidence/quality.json` SHA-256 `dd21d2eb91c2faf9e5542ebafd3aff44fec4c99b84e6a8c6f8fad87d0d5fde49`.
- Log `/private/tmp/freemancodz-r14-correction-quality.log` SHA-256 `120ac33c505125b6b518950fbf9c47d47b1242d97043ff60703a04526da6f1c5`.

## Fresh corrected acceptance execution

`npm run verify:acceptance` and its matching evidence command each exited **0** on the same isolated revision and 288-input digest. All eight stages passed. The run executed two workflow/status and seven Chromium/WebKit assistant cases with zero failures, skips or cancellations. It used the disposable database and controlled provider responses.

- Report `/private/tmp/freemancodz-r14-correction-Oju5ps/evidence/acceptance.json` SHA-256 `ad8f2f963c81d3b622064fdbf25666fe9423dcb7b5cab41c0df70a3a3d7579dc`.
- Log `/private/tmp/freemancodz-r14-correction-acceptance.log` SHA-256 `6426d792204a5a298a4c3e0b4d5eef4bb18f1e1d0c03a3975d1001644c903696`.
