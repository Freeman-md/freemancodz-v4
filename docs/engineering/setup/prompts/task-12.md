# Source snapshot: 📄 Task 12 — Automate Quality Gates with Git Hooks & CI

Source: https://app.notion.com/p/416b505dc85281a9a757e9d580b78ec4?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-12T10:52:46.826Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc85281a9a757e9d580b78ec4 as of 2026-11-12T10:52:46.826Z:
<page url="https://app.notion.com/p/416b505dc85281a9a757e9d580b78ec4" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 12 — Automate Quality Gates with Git Hooks & CI"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Use after the canonical verification command exists. This task automates existing checks, verifies observable enforcement, and preserves separate quality and release-readiness signals.

```txt
# Task 12: Automate Verification with Git Hooks & CI

Act as a Principal Software Engineer responsible for making the repository's approved engineering verification automatic, observable, and merge-blocking where authorised.

## Objective

Wire the existing canonical quality verification into appropriate local Git hooks and repository CI, then establish or clearly document the hosted required-status-check configuration.

**A workflow running is not the same as a merge gate.** Do not claim merge enforcement until repository protection settings and an actual required check have been verified.

## Inputs

Inspect:
- `docs/engineering/VERIFICATION_CONTRACT.md`, `INTEGRATION_VERIFICATION.md`, `ENFORCEMENT_MATRIX.md`, `COMPLIANCE_BASELINE.md`, and `EXCEPTIONS.md`.
- Approved architecture, ADRs, coding standards, `AGENTS.md`, and actual package commands.
- Existing Git hooks or hook managers, CI workflows, repository branch/ruleset settings, and deployment integration where access is available.
- The real verification results: quality passes on a PostgreSQL-capable runner; three D2–D4 acceptance tests still fail, and release readiness is not green.

## Responsibilities

1. **Inspect before creating.** Reuse existing hooks, CI conventions, and scripts rather than adding duplicate tooling. Identify actual default branch, PR flow, CI provider, and release/deployment process.

2. **Local fast feedback.** Add an appropriate version-controlled pre-commit hook for reliable, fast checks on changed files. Prefer a lightweight scoped gate; keep the full `npm run verify` available as the authoritative local command. Use pre-push only when its required dependencies can run reliably; do not force a destructive database startup at every commit. Clearly document that local hooks can be bypassed and are not merge protection.

3. **Reproducible CI environment.** Add or update the CI workflow for pull requests and relevant protected-branch pushes. Provision the repository's pinned Node/toolchain version (Node 24 here if still current), install locked dependencies, generate Prisma client, start disposable PostgreSQL, apply committed migrations, and run the canonical `npm run verify` command. Reuse test setup from Task 10/11 and pin workflow dependencies/actions appropriately.

4. **Secure isolation.** Use synthetic credentials and disposable databases only. Prevent production or shared environment connections. Use least-privilege CI permissions, avoid printing secrets, and handle forked PRs safely. Do not execute untrusted PR code with privileged tokens or use an unsafe `pull_request_target` configuration.

5. **Fail closed.** Missing required services, migration failures, failing architecture checks, test failures, and incomplete stages MUST result in a failed CI job. Never allow `continue-on-error`, implicit skips, swallowed exit codes, or baseline rewriting for a required gate.

6. **Separate quality, acceptance, and release.** Make the currently passing quality baseline the proposed PR-required check. Keep `npm run verify:acceptance` visible and runnable, but do not silently turn the three known D2–D4 failures green or describe a green PR quality check as release readiness. Define a separate release/promotion gate that remains FAIL/BLOCKED while acceptance or other mandatory release evidence fails. If release enforcement would require changing a deployment system, report the configuration/approval needed rather than modifying it silently.

7. **Required hosted status checks.** Inspect GitHub/Git provider branch protection or rulesets and the precise CI check name. If authorised and supported, configure the relevant protected branch so merging requires the successful full-quality CI job and cannot bypass it through ordinary merges. Changing remote protection, administrative settings, permissions, or deployment gates requires explicit owner approval unless already specifically authorised. If you cannot inspect or change these settings, mark hosted merge enforcement UNVERIFIED/NOT CONFIGURED and provide exact steps. Do not infer protection from a workflow YAML file.

8. **Evidence and diagnostics.** Give checks stable names, visible stage/job failures, and artifact retention for non-sensitive verification summaries. CI should indicate commit, command, exit status, and any blocked prerequisite, without exposing credentials or customer data.

9. **Proof.** Validate workflow/hook configuration, run the hook on a representative compliant and failing fixture, run local/isolated CI-equivalent commands, and where access permits inspect an actual workflow result on the intended branch. Demonstrate that a deliberately failed mandatory check makes CI fail. If remote testing is unavailable, label it UNVERIFIED rather than simulating success.

## Clarification — Trigger Coverage and Hook Activation (12 November 2026)

This clarification is part of Task 12 and does not expand its implementation scope.

1. **Prove Git hook activation, not merely existence.** A tracked hook file is not automatically active in a fresh clone. Document the installation mechanism (hook manager or `core.hooksPath`) and demonstrate a real Git pre-commit event in a disposable checkout with one compliant and one violating staged change. Do not create commits in the target working branch for this test.
2. **Report each enforcement boundary separately:** (a) optional during-edit agent hooks, (b) locally installed Git pre-commit hooks, (c) CI executing on a real PR/push, (d) hosted required status checks / merge protection, and (e) release/promotion gates. Mark each **VERIFIED, CONFIGURED BUT UNVERIFIED, MISSING, or BLOCKED**, with evidence.
3. **Do not confuse agent hooks with repository gates.** Codex supports lifecycle hooks (including `PostToolUse` and `Stop`) in trusted project `.codex/` configuration; these are optional client-specific safeguards, require trust/activation, and cannot replace Git/CI. **Do not install Codex-specific hooks in Task 12.** Note a possible lightweight per-edit check or task-completion check for a later agent-workflow integration task, subject to approval.
4. **No per-keystroke full verification.** Hooks run at their actual lifecycle events, not continuously. Keep local checks inexpensive; full canonical `npm run verify` belongs at the required CI boundary and at implementation completion through the future milestone integration.
5. **Do not overclaim enforcement.** A GitHub Actions file is not proof of a successful hosted run, and a successful run is not proof that merging is blocked. Report the exact hosted settings still needing owner approval. Preserve the failing D2–D4 acceptance status and release-readiness block.
6. **Keep status reporting concise.** In `QUALITY_GATES.md`, give a compact matrix of trigger, installation/activation, command, observed outcome, and remaining action. Maintain all existing Task 12 constraints and approvals.

## Strictness Requirements

- Never weaken the Task 11 verification contract or the accepted architecture/standards to achieve green CI.
- Do not approve new exceptions, modify application behaviour, or hide known acceptance failures.
- Avoid broad job/path filters that leave relevant source or rule changes unchecked.
- A green PR quality result MUST be clearly distinguished from accepted-change completion and release authorisation.
- Local hooks are convenience gates; required server-side checks are the merge boundary.
- No production credentials, migrations, destructive shared-environment actions, deployment promotion, or remote protection changes without proper authorisation.
- Report the exact installed status and evidence separately for local hooks, CI workflow execution, required branch protection, and release promotion checks.

## Deliverables

- Minimal Git hook manager/configuration and documented install instructions (only if needed).
- A CI workflow (for example `.github/workflows/quality.yml`) that invokes the canonical verification command in a disposable environment.
- `docs/engineering/QUALITY_GATES.md` describing triggers, check names, required tooling, isolation, evidence, bypass limitations, actual hosted settings, and separate quality/acceptance/release gates.
- Any minimal package script or lockfile changes needed to connect existing commands; preserve canonical verification semantics.

## Validation

1. Run existing local checks and confirm the new hook succeeds and fails correctly.
2. Verify CI-equivalent setup and `npm run verify` with disposable PostgreSQL; record exit codes.
3. Test a controlled failing quality check and confirm a non-zero CI-equivalent result.
4. Verify that the acceptance/release path still reports the D2–D4 blockers.
5. Inspect actual remote CI run(s) and required branch settings if accessible, marking each unverified element explicitly.
6. Review the diff for unsafe triggers, excessive permissions, unexpected bypasses, and out-of-scope edits.

## Execution Constraints

Modify only Git-hook setup, CI/workflow configuration, minimal wiring scripts/package dependencies, focused tests for the gates, and `docs/engineering/QUALITY_GATES.md`.

Do NOT modify application code, acceptance tests/expected outcomes, approved architectural documents, exceptions, ADRs, or the independent milestone workflow.

Do not commit, push, merge, deploy, or change hosted repository protection without explicit authorisation.

## Final Response Contract

Return no more than 120 words:

1. **Implemented:** Local hooks and CI configuration.
2. **Proof:** Actual passing and deliberately failing results.
3. **Hosted enforcement:** Required check status, branch protection status, and any approval needed.
4. **Readiness:** Quality versus acceptance/release status.
5. **Next step:** Whether Task 13 can begin.

Keep detailed configuration and evidence in repository documentation.
```

</content>
</page>
