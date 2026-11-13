# Task 12 execution receipts

Executed on 2026-11-13. The [quality gate contract](../../QUALITY_GATES.md) separates the installed hook trial, CI-equivalent execution, hosted checks and release authority.

## Git and workflow configuration

- `actionlint .github/workflows/quality.yml` exited **0** with the checksum-verified v1.7.12 binary. Workflow SHA-256 `5d7c816cbd0c3dcb8355d5667b199720aed19ad573f7c95f5c61223199e43b5e`.
- The tooling test installed `.githooks` using the disposable repository's actual Git configuration. Compliant commit **0**, violating staged blob **1**, compliant partial commit with dirty unstaged content **0**, staged symlink **1**. The exact hook content enters the quality digest. The test changed only that file and observed a different digest. The isolated committed hook is executable (Git mode `100755`). The live checkout's Git configuration and index were untouched.
- `/private/tmp/freemancodz-task12-hook-final.log` SHA-256 `227f8d356ab73e034fb4bf885332f1accddbd5a81195fa1ab97f8bf43aa9b150`. Hook SHA-256 `bb162adcd27c9d473f80f2ff925e09386c3fb8686ce7ddc26e8d34805ca40f96`.

## Clean install and isolated quality

The test checkout at `/private/tmp/freemancodz-task12-RTPIA2/checkout` has a disposable commit `a5a9d04a42b80cc65fcbc101e7ae9fb17898e0cc`. Its authored quality inputs match the live task snapshot except for the owner-edited chat constants. The clone uses the original committed blob `dba8b3c542fdbbc50b238ae2bb34f4fcf67e1e77`. The live file retains `e9e2e1fc3bf6d4055a0ee13547624aca7e785f3b`.

With Node 22.17.0, npm 10.9.2 and the documented synthetic install URL, a real clean `npm ci` exited **0**, installed 938 packages, and generated Prisma Client 7.9.1. Lockfile SHA-256 `2899f89034b6cf6a9c66719f8066533be16b867352857d804bac7600a668c8f9`. The install log SHA-256 is `e3a0a869f5fcc80a8d0c62ee3facb92bbe596eea27ed1c8d516523fb02b39f23`.

Free disk fell below 300 MiB. The executor matched the lockfile and actual versions of all 938 installed package paths against the existing workspace dependency tree, removed only the disposable clone's install, and linked the workspace packages for the build. Hidden npm installation metadata differed. This split trial verifies a real clean install and a complete local quality run with matching package versions. It does not claim a contiguous Linux or Actions run. Dependency comparison log SHA-256 `316e36d13092bb9e61aa063cb0b875784d4e54bdc85cc32453a3fe9cbb6df1ed`.

| Trial                              | Observed result                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial isolated runtime           | Node 26.5.0 was selected by the temporary checkout shell. Preflight reported BLOCKED and exit 1.                                            |
| Corrected canonical quality        | Node 22.17.0 on macOS arm64. All 16 stages and matching evidence validator exited 0.                                                        |
| Required suites and build          | 39 unit, 46 tooling and 65 database/integration tests passed, with zero skips. 23 migration SQL files, production build and cleanup passed. |
| Controlled mandatory-check failure | A new temporary fixture import triggered ARC-003 and ESLint. Each exited 1. Full quality exited 1.                                          |
| Evidence after the negative trial  | Failed report rejected with exit 1. After fixture removal the checkout was clean and the original positive report validated again.          |

- Positive identity: 286 files, digest `0560718940921af3be65795657d0b5efb260923e30c12365cd28944d6801504a`.
- Reports in `/private/tmp/freemancodz-task12-RTPIA2/evidence/`. Positive `quality-final.json` SHA-256 `2b7da44adfb398765cbe28730b074974c5af61f80cfd20eb23f753a1f2e3f3db`. Wrong-runtime `quality.json` SHA-256 `4fa145a5d4632fcaac2b67f7a9a74be0b195e953311cf61129dc6e23bb98702d`. Negative `quality-controlled-failure.json` SHA-256 `a77bcdb12dfd222664c3e753d914ca97728cb4a1de1e2422a037f0aca5d6de92`.
- Positive log `/private/tmp/freemancodz-task12-quality-final.log` SHA-256 `1f830229a165e1ca1a3c3a29d8bde83a4d29fe1a9b252277f4c86577a3926768`. Negative log `/private/tmp/freemancodz-task12-controlled-failure.log` SHA-256 `e3bf115e44623f7dc2b62b937c245d6e9b86b7b26b41cca6bb9f3882504fb0a1`.

## Dependency observation and remaining boundaries

Install reported 39 dependency advisory entries, including two critical and 17 high. A separate read-only `npm audit --package-lock-only --omit=dev --json` observed 32 production dependency entries, including two critical (`next@16.2.12` and `proxy-addr@2.0.7`) and 17 high. The latter is transitive via `shadcn`, the MCP SDK and Express. Deployment reachability and remediation remain unverified. The lockfile was preserved. Carry this observation to release risk assessment. It is outside the currently approved mandatory quality stages.

GitHub Actions, required main check and release promotion remain separate. At the read-only hosted inspection, Actions had zero runs and main's existing ruleset had no required quality check. See the [hosted preflight](hosted-ci-preflight.md). Task 11 acceptance remains evidence for its own snapshot. No production or Preview deployment was requested or initiated by these local trials.
