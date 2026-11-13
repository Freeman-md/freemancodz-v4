# Engineering gate validation

Task 14 · 2026-11-13 · **LOCAL VALIDATION PASSED AFTER R14-01 CORRECTION**. The initial failures below are preserved. See [independent closure](#independent-closure).

This is an isolated enforcement exercise under existing ADR-0001/0002 and approved verification requirements. No new architectural decision or exception is proposed. Production source, acceptance expectations, approved contracts, gate scripts, hooks, CI, hosted settings and live milestones are unchanged by this task. The owner's constants edit remains preserved.

## Scope and identity

Live repository HEAD is `f6ea50c13fbf245d4f0403c697c98f27cbd4f3f5`, with the existing setup worktree. Task 12's independently verified disposable candidate is `/private/tmp/freemancodz-task12-RTPIA2/checkout`, commit `a5a9d04a42b80cc65fcbc101e7ae9fb17898e0cc`. Its original positive quality report remains at `/private/tmp/freemancodz-task12-RTPIA2/evidence/quality-final.json`, SHA256 `2b7da44adfb398765cbe28730b074974c5af61f80cfd20eb23f753a1f2e3f3db`, with 286 inputs and digest `0560718940921af3be65795657d0b5efb260923e30c12365cd28944d6801504a`.

The current parser CLI was executed against that exact unchanged candidate and matching report. Its source `scripts/engineering/verification-evidence.mjs` SHA256 is `4b1a5bb00c5c9120a8f0238bd02151c614adf206e76aef37a0d68b539c790884`. The tests below changed only outside-repository JSON copies. Runtime was Node 22.17.0, npm 10.9.2, macOS arm64. No new dependency tree, database or provider access was needed for these parser probes.

Actual prior results are reused only within their verified scope: [Task 09 matrix](ENFORCEMENT_MATRIX.md), [Task 10 integration evidence](INTEGRATION_VERIFICATION.md), [Task 11 receipts](setup/evidence/task-11-results.md), [Task 12 hook/CI-equivalent receipts](setup/evidence/task-12-results.md), and [Task 13 separate-reviewer trials](setup/evidence/task-13-review-trials.md). A historical pass is not a current whole-checkout receipt. The failure found here does not erase actual prior execution; it shows the automatic receipt validator accepts malformed metadata.

## Enforcement boundaries

| Boundary / trigger                                            | Positive and negative proof                                                                                                                            | Classification and limitation                                                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Deterministic source checks / `check:architecture`            | Actual compliant and violating child processes in the unchanged 36-case checker suite; Task 12's real new forbidden import returned ARC-003 and exit 1 | **VERIFIED** for documented syntax/ownership scope; semantic boundaries remain review-required                                               |
| Formatting, lint and type checks / canonical stages           | Task 12 positive stages exited 0; staged formatting violations and the forbidden import returned nonzero with relevant formatter/lint diagnostics      | Formatter and lint rejection **VERIFIED**. Typecheck execution passed. An intentional type-error rejection was unexercised.                  |
| Canonical quality / `npm run verify` and receipt consumption  | Task 12 all-stage exit 0; actual authored import violation made architecture/lint and overall quality exit 1; Task 14 metadata mutation tests below    | Execution/failure propagation **VERIFIED**; metadata/schema trust control **FAILED**, R14-01                                                 |
| Locally installed Git pre-commit / real commit                | Explicit `core.hooksPath` in temporary repository; compliant commit 0, staged violation 1, clean staged/dirty unstaged commit 0, symlink 1             | **VERIFIED** in actual disposable Git events; live installation not configured, local bypass remains possible                                |
| CI workflow / PR or main push                                 | Actionlint 0; locked clean install and full isolated quality pass/fail. Linux/Actions has not supplied a run for this snapshot                         | **CONFIGURED BUT UNVERIFIED** hosted; local CI-equivalent execution is not Actions proof                                                     |
| Hosted required checks / main merge boundary                  | Last observed ruleset only protects deletion and non-fast-forward updates                                                                              | **MISSING** required quality/PR merge protection as last observed; approved configuration remains unapplied                                  |
| Independent review / separate context                         | Actual `/root/setup_review` skill invocation and five Task 13 cases: CHANGES REQUIRED, BLOCKED, BLOCKED, ESCALATE, bounded PASS                        | **VERIFIED** explicit invocation and judgment; automatic client discovery and milestone integration remain unverified                        |
| Acceptance and release / explicit commands and owner decision | Task 11 actual nine browser cases passed; report applicability below. Release contract requires separate evidence and owner decision                   | Historical acceptance **VERIFIED within scope**; current whole-snapshot/release readiness **BLOCKED**; no automatic promotion gate installed |

Optional per-edit agent hooks are **MISSING (optional)** and were not installed. Neither their absence nor a local hook substitutes for server-side merge protection.

## Distinct controlled scenarios and positive counterparts

The unchanged `tests/engineering/check.test.mjs` SHA256 is `47767f75b47fb090d0bfea64cd327f155d7b230c16c3989fb94559bdebe4a8e3`; checker SHA256 is `01c7233333121a37b2e8b5609233b1459770a8b7ddd9a290d6b8dbc712ea5651`. The Task 12 canonical tooling run executed these 36 cases within 46 total tooling cases, all passing. The following records identify real assertions and process boundaries, not inferred coverage from test names alone.

| Scenario                                           | Reused executed proof and compliant counterpart                                                                                                                                       | Result / scope                                                                                                                                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forbidden imports and concrete DB/client ownership | `compliant owned code...`, `adapter concrete infrastructure/repository imports...`, `each source detector produces a real non-zero process exit...`; Task 12 controlled actual import | Allowed own-code/type/inert cases exit 0; forbidden edges have rule-specific exits 1. Relative, alias, import/re-export/static dynamic forms covered                                                                    |
| D2 boundaries and existing debt                    | `D2 rejects altered inert files...`, exact binding/count ratchet; Task 13 GAP-008 versus legitimate type-only Pick and inert errors                                                   | Exact permitted cases pass; new/increased/stale baseline and non-inert graphs fail. No approved exception exists or is invented                                                                                         |
| Structural roots and suppressions                  | `new suppressions and parallel source roots...`, `suppression detection distinguishes JSX/template...`                                                                                | Genuine directives/unsupported roots reject; ordinary JSX/template text passes. Semantic naming/complexity remains independent review; no cycle policy or arbitrary numeric rule is introduced                          |
| Formatter and partial staging                      | `formatter fails changed/new/stale hashes...` and actual Task 12 hook commits                                                                                                         | Formatted staged content passes; changed/new debt, stale entries, parser errors and symlinks reject. Hook reads index blobs, not an unstaged substitute                                                                 |
| Missing prerequisites and failed child             | Task 11 corrected unavailable-Docker CLI exit 1/BLOCKED; tooling child exit 7 yields overall failure; Task 12 Node 26 preflight blocked and Node 22 passed                            | No required skip becomes green. Unexpected harness errors are separately recorded as failures, not product defects                                                                                                      |
| Real DB identity and isolation                     | Actual 65-case DB suite, 23 migrations, validated fixture identity and raw unsafe-target control                                                                                      | Owned target passes; unknown/shared target rejected before DB access with expected exit 1. Ownership/transaction/fencing/privacy tests ran against real disposable PostgreSQL; this does not prove hosted DB privileges |
| Functional defect beyond static checking           | Task 13 owner-equality removal: target Node tests 1 pass/1 fail, exit 1; reviewer R13-001 High/Confirmed                                                                              | Task 14 additionally executed unchanged base: 2/2 pass, exit 0. Same criteria distinguish compliant behavior from the target defect                                                                                     |
| Missing review evidence and approval               | Separate Task 13 review actually inspected source/manifests and refused missing evidence/unaccepted implementation; authoring proposal stopped affected work                          | BLOCKED / ESCALATE were observed. The legitimate unchanged baseline comparison received scoped PASS without waiver or merge approval                                                                                    |

The additional functional positive command was `node --test --test-reporter=tap /private/tmp/freemancodz-task13-DQu9yB/01-functional-defect/base/review-token.test.mjs`, exit **0**, two passed and zero skipped. Output is `/private/tmp/freemancodz-task14-functional-positive.log`. The paired target failure and independent rerun are retained in Task 13's receipt.

## New receipt trust probes

Thirteen actual CLI invocations used:

```text
/Users/freemancodz/.nvm/versions/node/v22.17.0/bin/node
  /Users/freemancodz/Projects/freemancodz-v4/scripts/engineering/verify.mjs
  evidence quality /private/tmp/freemancodz-task14-evidence-C3CsmL/<case>.json
```

Working directory for every invocation: `/private/tmp/freemancodz-task12-RTPIA2/checkout`. Child environments used the existing clean system allowlist. Case files contain only copies of the known non-sensitive quality report. The directory retains each JSON/log, `results.json` for the first twelve probes and `fixture-id-array-result.json` for the thirteenth, with exact argv, exits and output hashes. None is a genuine replacement execution receipt or owner approval.

| Case                                                              | Expected exit | Actual exit | Observed control                                                |
| ----------------------------------------------------------------- | ------------- | ----------- | --------------------------------------------------------------- |
| `matching` unchanged positive report                              | 0             | 0           | VERIFIED; matching evidence PASS                                |
| `missing-file` nonexistent receipt                                | 1             | 1           | VERIFIED; read failure is nonzero                               |
| `invalid-json` malformed JSON text                                | 1             | 1           | VERIFIED; parse failure is nonzero                              |
| `wrong-version` version 2                                         | 1             | 1           | VERIFIED; unsupported version rejected                          |
| `missing-stage` removed required stage                            | 1             | 1           | VERIFIED; incomplete required stages rejected                   |
| `skipped-tests` unit skipped count 1                              | 1             | 1           | VERIFIED; skipped required tests rejected                       |
| `zero-tests` unit tests/pass counts 0                             | 1             | 1           | VERIFIED; empty suite rejected                                  |
| `stale-revision` different HEAD identity                          | 1             | 1           | VERIFIED; stale snapshot rejected                               |
| `failed-stage` lint FAIL/exit 1                                   | 1             | 1           | VERIFIED; failed required stage rejected                        |
| `missing-runtime` deleted runtime object                          | 1             | 1           | VERIFIED; absent execution context rejected                     |
| `invalid-runtime-types` object node, numeric platform, array arch | 1             | **0**       | **FAILED**; malformed execution context reported matching PASS  |
| `invalid-timestamp-types` numeric start 0 / finish 1              | 1             | **0**       | **FAILED**; Date.parse coercion admitted invalid schema values  |
| `fixture-id-array` valid identifier wrapped in one-element array  | 1             | **0**       | **FAILED**; RegExp coercion admitted an invalid fixture-ID type |

## Confirmed failure and correction boundary

**R14-01 — High / Confirmed — evidence metadata false-green.** `validateEvidence` in `scripts/engineering/verification-evidence.mjs` checks runtime members for truthiness, passes timestamps directly to `Date.parse`, and fixture ID directly to `RegExp.test`. Those coercive checks allow the three malformed scalar-type variants above despite the existing strict evidence contract.

Impact is specifically automatic trust in malformed metadata. No stage-count, database-isolation, source-identity or trusted-provenance bypass was demonstrated. Reports are already documented as unsigned local consistency artifacts, so this is not a claim of cryptographic forgery resistance or a live security exploit. It is nevertheless a blocking violation of the approved fail-closed malformed-report requirement.

The independent reviewer separately reproduced all three false acceptances. Its additional fixture-ID probe is `/private/tmp/freemancodz-task14-review-_7_yc0qm/array-fixture-id.json`, SHA256 `f7ebee99100456715f3ed3af15b3c2597d63aa3f6a3405740fc4711c19c6bd7c`.

Required correction: explicit valid scalar types and canonical ISO timestamp validation for runtime context and fixture ID, preserving version 1 and real producer values, plus focused regression cases and current positive/negative CLI proof. This is repair of an existing mandatory requirement, not a new architecture or standards decision. **Task 14 does not modify the gate.** The orchestrator will dispatch separately scoped Task 11/12 rework, require independent review, and then repeat affected trust controls and current full quality/acceptance runs before clearing R14-01.

## Quality, acceptance, hosted and release limits

Task 12's actual full quality PASS and controlled FAIL remain evidence for that candidate: 39 unit, 46 tooling, 65 DB cases, 23 migrations, build and precise cleanup. Its clean install succeeded before a disclosed disk-driven switch to a version-matched dependency link. This was macOS CI-equivalent execution, not a contiguous Linux Actions run.

Task 11's actual acceptance command passed 2 workflow/status and 7 assistant browser cases with real Next HTTP, Chromium and WebKit. Task 14 rehashed all **244** recorded live application/browser/integration/Prisma/public/build inputs and found **zero changed paths**. That permits reuse of those bounded behavior observations. The whole checkout identity changed with governance/tooling; the old report is not current whole-snapshot acceptance, and it does not establish acceptance for the publication candidate excluding the owner's constants edit. New full quality/acceptance runs are deferred until the imminent parser correction to avoid duplicate builds; they remain explicitly pending.

The comparison used the Task 11 acceptance manifest's safe paths under `src/`, `prisma/`, `public/`, `tests/e2e/` and `tests/integration/`, plus `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts` and `prisma.config.ts`. SHA-256 was compared against each manifest entry.

The catalogue's ecommerce failures are inapplicable. No acceptance expectation was removed or turned green. Live provider reachability, target deployment configuration, migration rollout/recovery and release approval remain unverified. Existing dependency advisories recorded in Task 12 are carried forward for release assessment; no exploit probe, dependency remediation or waiver occurred here.

[APPROVAL-003](setup/APPROVALS.md#approval-003--draft-pr-and-required-hosted-quality-check) now authorizes the orchestrator's reviewed draft publication and subsequent main ruleset change, including a controlled failing/corrected PR trial. It does not mean those actions have happened. Publication is held pending independent parser correction. Actual Actions context/app identity, strict required check/PR enforcement and real hosted pass/fail behavior remain unverified or missing as last observed. No merge or production release authority was granted.

## Readiness and preservation

Seven required enforcement boundaries were assessed (with optional agent hooks separately identified). Thirteen new receipt cases and one paired functional positive were executed; unchanged deterministic, database, Git-hook and independent-review proof was reused with explicit scope. Ten receipt controls behaved as expected and three malformed-metadata variants failed rejection.

**Local enforcement is partially verified but not fully ready: R14-01 is blocking. Hosted merge enforcement is not operationally verified. Release readiness remains BLOCKED. Task 15 must not inherit a successful evidence-trust claim until correction, matching execution and independent review complete.**

All receipt mutations and functional probes remain under tool-created temporary directories. The live owner file retains Git blob hash `e9e2e1fc3bf6d4055a0ee13547624aca7e785f3b`. No production/configuration/gate/test/approved-specification files were edited during this initial Task 14 validation. Only this report is added to the repository; detailed immutable failures are retained for the correction review.

## Independent closure

The separately scoped Task 11/12 rework corrected **R14-01**. The reviewer verified the exact parser and tests, reproduced the 11 focused tests and 13 CLI controls, and validated fresh matching quality and acceptance reports. All 12 invalid or missing evidence cases now reject. The genuine report passes. The 16-stage quality run, 23 migrations and nine browser cases passed on one 288-file corrected snapshot that excludes the unrelated owner edit. See the [correction and executed evidence](setup/evidence/task-14-correction.md) and [independent verdict](setup/REVIEWS.md#task-14--corrected-local-enforcement-validation-pass).

The local evidence schema blocker is closed. The separate hosted trial independently verified that the required check failed on a controlled PR revision and passed after correction. The active main ruleset and evidence limits are recorded in the [hosted trial](setup/evidence/hosted-quality-trial.md) and [hosted review](setup/REVIEWS.md#tasks-12-and-14--hosted-required-check-trial-pass). Release readiness remains separately blocked.
