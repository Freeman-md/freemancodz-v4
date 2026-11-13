# Task 11 execution receipts

Executed on 2026-11-13 with Node 22.17.0, Next.js 16.2.12 and Prisma 7.9.1. The [verification contract](../../VERIFICATION_CONTRACT.md) identifies the required stages, fixture safety and release criteria.

## Corrected canonical quality run

`npm run verify -- --report /private/tmp/freemancodz-task11-quality-final.json` exited **0**. All 16 stages passed. Architecture and formatting reported 13 and nine exact recorded findings respectively, with zero new, increased or stale findings. The subsequent `npm run verify:evidence -- quality /private/tmp/freemancodz-task11-quality-final.json` exited **0**.

| Stage                                           | Observed result                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| Prerequisites, schema, generation, static gates | All exit 0, including the loader harness                            |
| Unit                                            | 39/39, zero failures, skips or cancellations                        |
| Engineering tooling                             | 45/45, zero failures, skips or cancellations                        |
| Fixture, migrations and seed                    | PostgreSQL 15, 23 migration SQL files replayed, seeded successfully |
| Database integration                            | 65/65, zero failures, skips or cancellations                        |
| Unsafe-target control within database stage     | Exit 1 before database access, as required                          |
| Production staging, generation and build        | Exit 0, unmodified production source, Next webpack                  |
| Cleanup and snapshot                            | Container and anonymous volume removed. Input snapshot unchanged.   |

- Base HEAD `f6ea50c13fbf245d4f0403c697c98f27cbd4f3f5`. Bounded worktree identity across 281 files `58f56a2e07dd76c60b3d0e0495980dea8705c97c36491dfbb5a223978ec14f6c`.
- Contract SHA-256 `1666214aef970a456a4c5115a04d69266dc4a3571cc175b304389c2fd8904f0c`.
- JSON SHA-256 `a36fd75766aae5b0705032bc78e885b612f1074d4f82733521f1d4035c16e5ec`.
- `/private/tmp/freemancodz-task11-quality-final.log` SHA-256 `a709de59f19b6ae85e1e25de1f5ee5fa9d069739e07b998f37ec404e3caa5b8e`.

## Canonical browser acceptance run

`npm run verify:acceptance -- --report /private/tmp/freemancodz-task11-acceptance.json` exited **0** on the same 281-file identity. All eight stages passed. The fresh database replayed 23 migration SQL files. Meeting fixture staging, generation and webpack build exited 0, followed by **2/2** workflow and notice-status cases and **7/7** assistant browser cases with zero failures, skips or cancellations. The fixture was removed. `npm run verify:evidence -- acceptance /private/tmp/freemancodz-task11-acceptance.json` exited **0**.

- JSON SHA-256 `366c8dafcbf731db946ba623ee1bd72feb5a024c5847f27267b48d6ce8d28783`.
- `/private/tmp/freemancodz-task11-acceptance.log` SHA-256 `9d67fb1cc7a141ec037886db5885accee79f11798400b1e600cc4b38f371e1b3`.

These runs used installed locked dependencies. Clean-clone installation is a separate CI trial. Browser coverage used controlled provider responses and unexecuted optional variants remain recorded in [Task 10](../../INTEGRATION_VERIFICATION.md). The catalogue's commerce cases are inapplicable to this repository. Release readiness is **BLOCKED** pending applicable live/hosted evidence, independent review of the proposed release and separate owner authorization.

## Final negative controls

- Corrected `npm run verify -- --report /private/tmp/freemancodz-task11-blocked-final.json` in the default sandbox exited **1**. Docker exited 1 at preflight, reported BLOCKED. The dependent stages remained NOT RUN and the snapshot matched. JSON SHA-256 `164efa050b3a566c2c0f09d899331aa717aa822f4289940f33e0d05d8d0b0293`. Corresponding log SHA-256 `6bb0cda4dc523797863a21e11ff7804b3eab6e3eb8e738927ff8cc6d38a92727`.
- The 45-case tooling suite exercised a real child exit **7** through the required-stage wrapper and an isolated orchestration subprocess. Both reported mandatory-stage FAIL and overall exit **1**. This deliberately invokes the actual stage wrapper with a synthetic failing child. Task 12 exercises the canonical command on a changed repository fixture.
- `npm run verify:evidence -- quality /private/tmp/freemancodz-task11-missing-stage.json` and the corresponding stale-identity fixture each exited **1**, rejecting incomplete stages and a mismatched revision or content identity respectively.

## Preserved first attempts

- The sandbox run exited **1**, reporting Docker prerequisite BLOCKED and required database and build stages NOT RUN. `/private/tmp/freemancodz-task11-blocked.json` SHA-256 `7f04dcdee92e3036d815ca30b57afa332f4ce8f47d17856dbbaa1fa05c995923`. Corresponding log SHA-256 `d7dc07880be70c87c636c0eaf4add921a4db5644dfaafc515235930b6f326d6d`.
- With Docker access the first full attempt exited **1** after passing Prisma and static stages. A TSX loader-registration error stopped the database harness before it could start. The corrected runner loads TSX through its normal import entrypoint after generation, and the loader regression test and rerun passed. `/private/tmp/freemancodz-task11-quality.json` SHA-256 `de488cb27eaa5f71ed1dc8cbd47e509a5357b073b288d782bd0e639fa0344909`. Corresponding log SHA-256 `2c508f29769a7f0116d81d496fc4cbe34b616db9a3adc93c4cf0a135bb5cc2b8`.
