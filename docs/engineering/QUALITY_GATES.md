# Engineering quality gates

Task 12 applies existing ADR-0001/0002 and approved ARC/STD rules. It introduces no exception or application behavior change. The canonical [verification contract](VERIFICATION_CONTRACT.md) remains authoritative. Local and isolated proofs do not establish hosted enforcement.

## Gate boundaries before the hosted trial

See [observed hosted enforcement](#observed-hosted-enforcement) for the verified PR and ruleset outcomes.

| Boundary / trigger               | Installation or activation                                                             | Command / observed scope                                               | Status and remaining action                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| During-edit agent hooks          | No Codex/client hook installed                                                         | None; a later approved workflow may add lightweight feedback           | MISSING (optional); not a repository gate                                                                           |
| Git pre-commit                   | Versioned `.githooks/pre-commit`; explicit local installation below                    | Staged safe formatting via `node scripts/engineering/check-staged.mjs` | VERIFIED in a disposable checkout with actual commits; live checkout activation NOT CONFIGURED                      |
| Full local / isolated CI quality | Locked dependencies, Node 22.17.0, Docker and exact pgvector image                     | `npm run verify`, then `npm run verify:evidence`                       | Executed results and exact snapshot are in the Task 12 receipts; this is CI-equivalent evidence, not an Actions run |
| GitHub PR and main push          | `.github/workflows/quality.yml` must be published                                      | Proposed job/check context `Engineering quality`                       | CONFIGURED BUT UNVERIFIED hosted; publication requires owner approval                                               |
| Required hosted merge check      | Owner-authorized main ruleset update after observing the real check/app identity       | Required successful `Engineering quality` check with strict freshness  | MISSING; existing rules protect deletion and force updates only                                                     |
| Browser acceptance               | Existing separate fixture command with matching browser prerequisites                  | `npm run verify:acceptance`                                            | Task 11 verified nine cases; additional source changes require matching acceptance evidence when relevant           |
| Release / promotion              | Explicit release contract, target/provider/deployment evidence and owner authorization | Verification contract's separate release decision                      | BLOCKED; a green quality job cannot authorize promotion                                                             |

## Installing the local convenience hook

After reviewing the versioned hook and installing dependencies, run this explicitly in the intended clone:

```sh
git config --local core.hooksPath .githooks
git config --local --get core.hooksPath
```

No postinstall script modifies Git configuration. Fresh clones do not activate the hook automatically. Task 12 does not change the live checkout's `.git/config`. If another hooks path is already installed, reconcile its responsibilities before replacing it. There is no pre-push database startup, hook manager dependency or per-keystroke full verification.

The executable hook resolves the repository root and invokes the small staged formatter. The checker obtains filenames/modes/object IDs from Git's index, filters unsupported and secret-bearing paths before reading any blob, and reads supported regular files through their staged object IDs. It uses staged `.prettierrc.json` and the exact staged format baseline. It rejects unresolved index conflicts and supported-path symlinks. It never rewrites files, reads environment files or opens an unstaged source version to decide whether staged content passes.

Existing exact formatting debt is retained only when the staged content matches its recorded hash. A changed legacy file must format correctly, and its resolved baseline entry must be removed through review. Comparison is scoped to changed supported paths; deleting files, editing the global formatter/baseline, architecture, types and behavior still require the full canonical gate. Unsupported files and secret-bearing names are not inspected by this formatter; it is not a secret scanner or permission to commit secrets.

The hook is inexpensive feedback, not a security or merge boundary. Users can bypass local hooks, change their local configuration or edit the checker. It relies on trusted local tooling. CI and independently verified hosted required checks are the enforceable boundary. Partial staging is covered: bad staged content is rejected despite a corrected worktree; compliant staged content can commit while unrelated unstaged formatting remains untouched.

## Proposed GitHub Actions workflow

The workflow runs on every `pull_request` event covered by GitHub's normal PR synchronization triggers and every push to `main`. There are no path filters, conditional quality-job skips, `pull_request_target`, write permissions or `continue-on-error`. There is one job, with display name `Engineering quality`; no prior workflow or duplicate context was found locally. The exact hosted context and GitHub Actions integration ID remain to be observed from the first real run.

The job uses `ubuntu-24.04`, Node **22.17.0**, full official action commit pins verified in the [hosted preflight](setup/evidence/hosted-ci-preflight.md), and checkout pinned to `${{ github.sha }}` with persisted credentials disabled. Permissions are `contents: read`; all unlisted token permissions are disabled. It uses the existing lockfile and postinstall generation:

```sh
DATABASE_URL=postgresql://synthetic@127.0.0.1:1/verification_no_connection npm ci
docker pull pgvector/pgvector:0.8.1-pg15@sha256:94aee7e88f98125114657cab98e28c5dfa8dd517a6bf83fd98b503439f1e3de6
npm run verify -- --report "$RUNNER_TEMP/quality.json"
npm run verify:evidence -- quality "$RUNNER_TEMP/quality.json"
```

The synthetic install URL prevents Prisma configuration from loading an environment file; install/generation do not connect. The canonical runner subsequently creates its own disposable DB and credentials. There is no second CI database service or weaker verification runner. The quality report binds the actual checked-out Git revision and explicit safe content identity. The workflow is itself a quality-input file. Task 12 adds the exact safe `.githooks/pre-commit` path to the existing quality digest because the tooling suite executes it; a focused freshness assertion proves hook-content changes invalidate evidence. Hook executable mode is checked separately in review and real commit tests. Historical Task 11 receipts remain historical. Task 15 must bind the complete reviewed change set, including future hooks and local skills.

Evidence validation and artifact collection use `always()` so failures retain diagnostics; this cannot convert a failed quality stage to green. Missing/incomplete/stale/non-PASS evidence fails validation. The uploader retains only the exact safe JSON report for seven days, never arbitrary worktree files, environment files, database URLs or raw provider/customer logs. Missing report upload is an error. Stage command/status diagnostics remain visible in the job log. A prior install failure still fails the job even when later dependent stages cannot run.

Hosted Linux execution remains unverified until an actual Actions run. Local clean-install and CI-equivalent proofs are explicitly labeled with their OS, Node version, snapshot, command exits and any disk-driven dependency reuse in [Task 12 execution receipts](setup/evidence/task-12-results.md). The isolated snapshot uses committed HEAD content for the owner's pre-existing `src/app/api/chat/constants.ts` edit; the live edit is untouched. Actual Git hook commits occur only in test-owned temporary repositories.

## Hosted settings and owner decision

Read-only preflight observations on 2026-11-13 found public `Freeman-md/freemancodz-v4`, default branch `main`, Actions enabled with default read token permissions, no visible workflow runs, no open PRs and auto-merge disabled. At that point, main's active ruleset 19097664 contained only `deletion` and `non_fast_forward`. Staging was unprotected with an empty branch-rule query. See the [original audit](setup/evidence/hosted-audit.json) and [preflight](setup/evidence/hosted-ci-preflight.md).

After independent review, obtain explicit owner authorization for publication and hosted configuration. Proposed scope:

1. Publish the reviewed change set without the owner's unrelated constants edit, create a real PR, and observe `Engineering quality` on its exact test-merge SHA. Check the actual context and Actions app identity, not only a workflow/job label.
2. Update the main ruleset to require a PR and the successful full quality check bound to that observed app, with strict up-to-date checking and no bypass actors. Preserve deletion/non-fast-forward protection and available merge methods. For this solo-maintainer repository, the recommended required approving-review count is zero; independent agent review and separate human merge authorization remain mandatory workflow obligations. These are proposals, not configured settings or approval claims.
3. Observe a controlled failing PR revision and its corrected passing revision while each is current. Confirm the check is required through Checks/PR API evidence and verify rule scope. No attempted merge is needed for this proof. A successful advisory check alone is insufficient.
4. Record any requested scope changes and approval evidence before hosted mutation. Publication may automatically create a Vercel Preview deployment: read-only metadata shows both Preview and Production integrations. Such a preview is not a production release or permission to promote it.

The catalogue's ecommerce D2–D4 cases are inapplicable here; no such tests or product features exist. This repository's acceptance signal was genuinely PASS in Task 11. Release remains BLOCKED by unverified target/provider/deployment obligations and absent release authorization, not by invented ecommerce failures. Hosted protection, merge and release decisions stay distinct from architecture/standards approval.

### Observed hosted enforcement

[APPROVAL-003](setup/APPROVALS.md#approval-003--draft-pr-and-required-hosted-quality-check) authorized draft publication and the hosted update. On [draft PR #32](https://github.com/Freeman-md/freemancodz-v4/pull/32), Actions passed the initial Linux quality run. Active main ruleset 19097664 now requires a PR and the up-to-date `Engineering quality` check from GitHub Actions app 15368, with no bypass. The controlled formatting violation failed the required check and GitHub reported the draft blocked. The restored revision passed. The initial local/unverified matrix above records the pre-trial state. The [hosted trial receipt](setup/evidence/hosted-quality-trial.md) records exact revisions, checks, rules and the successful Preview. The configured main push trigger is unexercised.
