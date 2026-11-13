# Source snapshot: 📄 Task 11 — Canonical Verification & Evidence

Source: https://app.notion.com/p/416b505dc85281f38229d7550e24518d?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-12T10:32:20.756Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc85281f38229d7550e24518d as of 2026-11-12T10:32:20.791Z:
<page url="https://app.notion.com/p/416b505dc85281f38229d7550e24518d" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 11 — Canonical Verification & Evidence"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Use after establishing deterministic checks and risk-based integration tests. This task standardises execution and reporting; it does not repair pending application behaviour or install CI gates.

```txt
# Task 11: Establish One Canonical, Observable Verification Entry Point

Act as a Principal Software Engineer responsible for reproducible quality verification across coding agents, local development, and future CI.

## Objective

Create one documented, repeatable command that runs the repository's **required, currently implemented** engineering checks and reports evidence of what actually ran.

A green quality check MUST NOT be presented as release readiness while approved acceptance requirements remain failing or unverified.

## Inputs

Inspect:
- Approved architecture, ADRs, and coding standards.
- `docs/engineering/ENFORCEMENT_MATRIX.md`, `COMPLIANCE_BASELINE.md`, and `EXCEPTIONS.md`.
- `docs/engineering/INTEGRATION_VERIFICATION.md`, including observed test results and remaining risks.
- Existing package scripts, local environment setup, architecture checker, linters, TypeScript, test suites, and build/release commands.
- `AGENTS.md` and relevant agent skills for current verification obligations.

Verify the actual commands before composing them; do not assume reported checks are executable in the current environment.

## Responsibilities

1. **Define the verification contract.** Establish a canonical entry point, preferably `npm run verify` for an npm repository, that composes the existing mandatory checks without duplicating their logic. Preserve separately runnable underlying commands.

2. **Run the required passing suite.** Include approved and available architecture checks, formatting, lint, type checking, unit/architecture tests, and the disposable real-database integration suite wherever the current engineering contract requires it. Order stages for useful early failures without hiding later failures.

3. **Handle environment prerequisites honestly.** Check Node/runtime requirements, generated clients, and disposable database configuration before running dependent stages. If a REQUIRED check cannot run, report **BLOCKED** and exit non-zero; never silently omit it or claim overall PASS. Do not connect to production/shared databases or use secrets in logs.

4. **Keep a separate acceptance signal.** Expose a clearly named acceptance command (for example `npm run verify:acceptance`) for tests of approved but unimplemented changes. Preserve the three known failing cases identified by Task 10: final-unit bestseller checkout, historical order snapshots, and stale Admin stock edits. These tests MUST remain failing until production behaviour is genuinely fixed.

5. **Separate quality from release readiness.** Define an explicit release-readiness result that includes acceptance evidence and the other approved release obligations. A passing baseline `verify` result means only that its specified stages passed. While acceptance tests fail, release readiness MUST remain **FAIL/BLOCKED**; do not claim that future CI/deployment gates are installed.

6. **Provide observable stage results.** Each stage must identify its command, PASS/FAIL/BLOCKED/NOT RUN status, exit code, and any prerequisite failure. Produce a concise terminal summary and, if practical, a machine-readable evidence artifact with commit/working-tree context. Never print credentials, customer data, or environment variable values.

7. **Use trustworthy exit semantics.** Any failed mandatory stage, missing required prerequisite, unexpected script error, or incomplete required stage MUST make the canonical command exit non-zero. An optional fast or scoped command may exist but MUST NOT be described as the full verification gate.

8. **Prevent bypasses.** Do not add flags that silently ignore failing checks, swallow shell errors, turn known failure into success, auto-approve exclusions, or update suppression baselines to make verification green.

9. **Preserve existing workflow boundaries.** Document which command later hooks/CI (Task 12) must call, and which evidence a human or reviewer must inspect for release. Do not edit hooks, CI, deployment settings, agent instructions, or the milestone workflow in this task.

## Deliverables

- A canonical quality command and any minimal supporting orchestration script.
- A separately runnable acceptance command that reports the actual current result.
- An explicit release-readiness command or documented decision contract; if implemented, it must report failing acceptance and unavailable mandatory evidence honestly.
- `docs/engineering/VERIFICATION_CONTRACT.md`, describing stages, commands, prerequisites, exit semantics, quality vs acceptance vs release status, risk-based evidence, and known blockers.

Reuse existing scripts and test infrastructure. Keep dependencies minimal. Adjust package scripts/configuration and focused orchestration tests only as needed.

## Validation

1. Run the canonical command and record each required stage's actual status and exit code.
2. Execute the standalone acceptance command and show its current genuine failing result without weakening the tests.
3. Verify with controlled fixtures that a deliberately failing required check returns a non-zero overall exit and an actionable stage diagnostic.
4. Verify that an unavailable required test database produces BLOCKED/non-zero, not a green or silently skipped result.
5. Confirm the command never points destructive tests at shared or production environments.
6. Run relevant existing checks and inspect the diff for unapproved changes.
7. Distinguish environment failure from application defects; if execution is unavailable, report UNVERIFIED rather than inventing evidence.

## Execution Constraints

Modify only the minimal verification orchestration, relevant package scripts/configuration, focused harness tests, and `docs/engineering/VERIFICATION_CONTRACT.md`.

Do NOT modify production application code, business tests or expected acceptance outcomes, approved architecture/standards/ADRs, exception decisions, agent instructions, hooks, CI, or deployment configuration.

Do not commit, merge, deploy, or perform destructive shared-environment operations without explicit authorisation.

**Task 12 will install automatic hooks and required CI checks.** The existence of `npm run verify` alone does not make it mandatory before merge.

## Final Response Contract

Return no more than 120 words:

1. **Implemented:** Canonical and acceptance commands created.
2. **Evidence:** Actual verification and controlled failure results.
3. **Readiness:** Whether quality, acceptance, and release readiness are PASS, FAIL, BLOCKED, or UNVERIFIED.
4. **Next step:** Whether Task 12 can start and any remaining prerequisites.

Keep all detailed commands, checks, and evidence in repository documentation.
```

</content>
</page>
