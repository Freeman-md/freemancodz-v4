# Source snapshot: 📄 Task 10 — Risk-Based Integration Verification

Source: https://app.notion.com/p/416b505dc852819f9b75f72b40872265?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-12T10:18:29.354Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc852819f9b75f72b40872265 as of 2026-11-12T10:18:29.371Z:
<page url="https://app.notion.com/p/416b505dc852819f9b75f72b40872265" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 10 — Risk-Based Integration Verification"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Use this reusable prompt after deterministic architecture checks are established. The coding agent must verify critical real boundaries safely and preserve failing evidence of unimplemented approved changes.

```txt
# Task 10: Establish Risk-Based Integration & Architecture Verification

Act as a Principal Software Engineer specialising in integration testing, data consistency, and release confidence.

## Objective

Build a focused, executable verification suite that tests critical architectural and business invariants across REAL system boundaries, rather than relying on mocks or static checks alone.

Reuse existing test infrastructure and prioritise the highest-risk scenarios documented by this repository. Do not attempt to test every feature exhaustively.

## Inputs

Read:
- `docs/architecture/ARCHITECTURE.md` and accepted ADRs.
- `docs/engineering/CODING_STANDARDS.md`, `CONTROLS_AUDIT.md`, `COMPLIANCE_BASELINE.md`, `EXCEPTIONS.md`, and `ENFORCEMENT_MATRIX.md`.
- Existing unit, architecture, integration, and browser tests; database migrations; local environment and test scripts.
- Actual implementation paths for high-risk workflows.

Confirm the relevant architectural decisions are approved. Identify which invariants have real-boundary evidence and which currently rely on mocks.

## Responsibilities

1. **Build a risk-based test matrix.** For each critical invariant, identify the risk, accepted rule or ADR, relevant components, test level, real external boundary, setup requirements, success and failure assertions, and current evidence status.

2. **Prioritise database invariants.** Where applicable, exercise actual committed migrations in a disposable database and verify:
   - atomic writes and rollback on failure;
   - concurrent or stale inventory updates and transaction isolation;
   - duplicate submissions or idempotency;
   - final-unit stock behaviour, including relevant database triggers;
   - cancellation/restoration exactly once;
   - preservation of historical order-time data and other approved invariants.
   Adjust the scenarios to the repository; do not invent business requirements.

3. **Fix false-green tests.** Strengthen existing success-path tests that only check calls or logs. Require observable return values, persisted outcomes, and meaningful failure assertions. In particular, investigate any test that passes while logging a `TypeError`. Test-only repairs to mock fixtures are allowed, but a real application defect must be reported, not hidden.

4. **Test authorization and integration boundaries.** Add targeted tests for critical Auth, Storage, API, server-action, or browser boundaries where they are part of the approved system and where isolated fixtures can be run safely. Prefer a few meaningful end-to-end contract tests to excessive shallow mocks.

5. **Preserve isolation.** Use synthetic accounts and data, unique namespaces, deterministic fixtures, explicit teardown, and a disposable local/test database. NEVER point migrations, resets, seeders, or destructive test commands at production or shared environments. Reject unsafe configuration.

6. **Make tests repeatable.** Provide clearly named commands, environment prerequisites, setup/teardown instructions, and reliable exit codes. Use the existing runner where practical. Avoid time-dependent, network-dependent, or flaky tests when a controlled alternative exists.

7. **Separate current behaviour from approved future behaviour.** When an accepted architectural change is not implemented, create an appropriate regression/acceptance test that demonstrates the gap, but do not modify production code to make it green. Clearly mark tests as currently failing or isolated/pending rather than silently skipping or rewriting expectations.

8. **Record evidence.** Document precise commands, exit codes, tested commit, boundary realism, passed/failed cases, prerequisites, and any coverage that remains mocked, blocked, or unverified.

## Strictness Requirements

- Passing unit tests with mocked boundaries MUST NOT be described as proof of real database or provider behaviour.
- A successful path MUST assert an observable successful outcome; a negative path MUST assert an observable failure or rollback.
- Tests MUST fail when a covered invariant is violated.
- Do not convert a failing integration test into a passing test by weakening assertions, adding a broad skip, or changing expected behaviour.
- Do not claim coverage for tests that were not executed.
- If required infrastructure is unavailable, mark the integration evidence BLOCKED/UNVERIFIED, record the reason and executable setup steps, and do not report green integration verification.
- Prefer deterministic disposable environments; do not use live customer data, production credentials, or destructive shared-environment operations.
- Do not confuse verification of existing behaviour with implementation of an approved design change.
- Avoid duplicating checks already proven by Task 9.

## Deliverables

- Focused architecture/integration/browser tests, fixtures, and necessary test-only helpers.
- Minimal test configuration or package scripts needed to execute those tests reproducibly.
- `docs/engineering/INTEGRATION_VERIFICATION.md`, containing a risk/invariant matrix, actual commands and results, setup and isolation instructions, known failing tests, and remaining integration evidence gaps.

## Validation

1. Execute all newly added tests where safe infrastructure is available; record exact commands and exit codes.
2. Demonstrate at least one negative/control case that fails when its targeted invariant is broken, without changing production source.
3. Verify that test isolation and teardown do not touch shared or production data.
4. Run relevant existing unit and architecture checks; report any regressions.
5. Report failure of actual behaviour separately from test-harness or environment failure.
6. Confirm the final diff contains no unapproved changes to production logic or architectural contracts.

## Execution Constraints

Modify only relevant tests, fixtures, test-only helpers, test configuration, associated package scripts/lockfile if necessary, and the integration-verification document.

Do NOT modify production application code, approved architecture/standards/ADRs, exception approvals, agent instructions, CI, Git hooks, or deployment configuration.

Do not commit, merge, deploy, or perform destructive operations without explicit authorisation.

Task 11 will establish the canonical verification command; Task 12 will make required gates automatic. Do not claim either is complete here.

## Final Response Contract

Return no more than 120 words:

1. **Implemented:** High-risk integration scenarios and test assets added.
2. **Evidence:** Tests actually run and their pass/fail status.
3. **Blockers:** Genuine defects, pending approved implementation changes, or environment constraints.
4. **Next step:** Whether Task 11 can begin.

Keep full evidence and detailed test matrices in repository documentation.
```

</content>
</page>
