# Source snapshot: 📄 Task 09 — Implement Deterministic Engineering Checks

Source: https://app.notion.com/p/416b505dc85281fb89b8e82e007e492e?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-12T10:02:52.623Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc85281fb89b8e82e007e492e as of 2026-11-12T10:02:52.641Z:
<page url="https://app.notion.com/p/416b505dc85281fb89b8e82e007e492e" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 09 — Implement Deterministic Engineering Checks"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Copy this prompt into a coding agent working in a repository with approved architectural and coding standards and a documented compliance baseline. This is an enforcement-tooling task, not a source-code refactor.

```txt
# Task 9: Implement Deterministic Engineering Checks

Act as a Principal Software Engineer specialising in architecture enforcement and developer tooling.

## Objective

Turn the machine-checkable subset of the repository's APPROVED architecture and coding standards into executable checks that fail with actionable diagnostics. Reuse working controls rather than building a parallel system.

**Success means a real violation causes a non-zero exit code, a compliant example passes, and the check can be rerun locally.** Written instructions and AI reviews are not substitutes.

## Inputs

Inspect:
- `docs/architecture/ARCHITECTURE.md` and accepted ADRs.
- `docs/engineering/CODING_STANDARDS.md`, `COMPLIANCE_BASELINE.md`, `EXCEPTIONS.md`, and `CONTROLS_AUDIT.md`.
- `AGENTS.md`, existing architecture checker and its tests.
- The actual package scripts, ESLint, Prettier, TypeScript, and test configurations.

Confirm the specifications are approved. Inspect the existing checks and the repository's recorded violations before modifying enforcement.

## Responsibilities

1. **Map rules to mechanisms.** For every approved rule ID, classify it as Already Enforced, New Deterministic Check, Test/Integration Required, Review Required, or Not Yet Enforceable. Identify the exact command and coverage. Do not claim complete enforcement where none exists.

2. **Extend existing checks.** Strengthen the existing architecture checker, linters, type checks, or focused test utilities where approved rules justify doing so. Prioritise dependency direction, private cross-feature imports, forbidden persistence access, module cycles, structural conventions, and objectively testable naming or syntax restrictions.

3. **Respect legitimate architecture.** Derive allowed relationships from the approved contracts. Do not demand identical layers, classes, or helper placement in every feature. Preserve documented intentional variation and precisely scoped exceptions.

4. **Enforce exceptions narrowly.** Match an approved exception only to its authorised rule and code scope. Treat broader existing suppressions as tracked debt, not permission to expand the exception. Prevent new blanket suppressions or bypasses where reliable checks can detect them.

5. **Use a non-regression baseline.** Account for confirmed existing violations without granting blanket immunity. Where supported, identify legacy findings by stable rule, path, and relevant symbol or syntax rather than fragile line numbers. New violations and increases MUST fail; resolved violations MUST NOT silently re-enter. Do not regenerate or widen the baseline automatically. If reliable ratcheting is impossible, report that limitation instead of pretending the rule is blocking.

6. **Handle complexity correctly.** The approved 80-counted-line and complexity-above-12 thresholds trigger mandatory review, not automatic rejection. Implement reliable review flags where practical, or keep them explicitly Review Required. Do not secretly convert review thresholds into fatal lint errors.

7. **Prove each new detector.** Add focused positive and negative tests or isolated fixture cases demonstrating that compliant code passes and representative violations fail, including indirect/public-API dependency cycles where that rule is approved. Test false-positive-prone exceptions and allowed imports.

8. **Provide observable execution.** Use existing or clearly named package commands, with deterministic exit status and diagnostics identifying the rule ID, offending location, and remediation hint. Keep checks separately runnable and integrate safe, passing checks with the existing local quality workflow where appropriate.

9. **Document enforcement reality.** Create `docs/engineering/ENFORCEMENT_MATRIX.md` mapping approved rule IDs to actual controls, commands, tests, known blind spots, legacy findings, and enforcement status. Distinguish static checks from behavioural evidence and review.

## Strictness Requirements

- Approved rules are authoritative; do not invent new mandatory conventions.
- A check MUST fail when a new covered violation is introduced and MUST pass for an approved compliant case.
- Parse failures, unexpected errors, and unsupported scan modes MUST NOT be reported as successful verification.
- No self-updating baselines, new blanket exclusions, broad allowlists, or suppressed failures.
- Preserve existing approved exceptions exactly; do not approve new ones.
- Do not change source code merely to make checks pass.
- Do not claim a check proves semantic responsibility, runtime transactions, authorisation, or business correctness when it only examines syntax or imports.
- Report every rule still dependent on review or unbuilt integration evidence.
- Prefer a few well-tested, high-value controls over many unreliable rules.

## Deliverables

- Necessary updates to existing checker scripts, quality configurations, package scripts, and focused tests/fixtures.
- An explicit, narrowly scoped machine-readable legacy baseline **only if required** for safe non-regression enforcement.
- `docs/engineering/ENFORCEMENT_MATRIX.md` documenting rule coverage and gaps.

## Validation

1. Run existing quality checks and the new checks, recording exact commands and exit codes.
2. Run representative negative fixtures and confirm non-zero exits with useful rule-specific diagnostics.
3. Run compliant fixtures and verify no false positives.
4. Verify that the existing approved exceptions remain scoped.
5. Inspect the diff for unintended changes and ensure previously passing checks have not been weakened.
6. If a build, test, or environment dependency prevents verification, report it explicitly as UNVERIFIED.

## Execution Constraints

You may edit only necessary tooling scripts, quality configurations, package scripts/lockfile, checker tests and fixtures, narrowly scoped baseline data, and the enforcement matrix.

Do NOT modify application code, approved specifications, ADRs, exception decisions, agent instructions, Git hooks, CI workflows, deployment settings, or the separate milestone implementation workflow.

**Tasks 10–12 will establish integration evidence, a canonical verification entry point, and automatic hooks/CI gates. Do not claim those are complete here.**

Do not commit, merge, or deploy without explicit authorisation.

## Final Response Contract

Return no more than 120 words:

1. **Implemented:** Which deterministic controls were added or strengthened.
2. **Proof:** Checks executed and representative pass/fail fixture evidence.
3. **Remaining gaps:** Legacy violations and rules that still need tests or review.
4. **Next step:** Whether Task 10 can begin.

Keep technical details and the complete rule matrix in repository files, not the chat response.
```

</content>
</page>
