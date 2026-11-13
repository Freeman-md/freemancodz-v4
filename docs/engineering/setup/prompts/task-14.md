# Source snapshot: 📄 Task 14 — Validate Engineering Enforcement

Source: https://app.notion.com/p/416b505dc85281a79923fc982713d217?pvs=204

Retrieved: 2026-11-13. Source last edited: 2026-11-12T11:09:13.512Z.

This is reference material supplied by the owner for this setup, not evidence of repository completion. Repository-specific adaptations and approvals are recorded in the setup checklist.

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/416b505dc85281a79923fc982713d217 as of 2026-11-12T11:09:13.534Z:
<page url="https://app.notion.com/p/416b505dc85281a79923fc982713d217" icon="📄">
<ancestor-path></ancestor-path>
<properties>
{"title":"Task 14 — Validate Engineering Enforcement"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📄"}</iconMetadata>
<content>
Use this reusable prompt after local checks, CI configuration, and independent review have been established. Test controls through isolated, deliberate violations without modifying production behaviour or hosted settings.

```txt
# Task 14: Validate Engineering Enforcement End to End

Act as a Principal Software Engineer and Independent Quality Assurance Lead.

## Objective

Independently verify that the repository's engineering controls detect violations, block non-compliant changes at their intended boundaries, and produce trustworthy evidence.

This is an adversarial validation exercise, not a feature implementation or refactoring task.

**Success means demonstrated enforcement, not merely passing existing tests.**

## Inputs

Inspect:

- `docs/architecture/ARCHITECTURE.md` and accepted ADRs.
- `docs/engineering/CODING_STANDARDS.md`.
- `docs/engineering/ENFORCEMENT_MATRIX.md`.
- `docs/engineering/VERIFICATION_CONTRACT.md`.
- `docs/engineering/QUALITY_GATES.md`.
- `docs/engineering/REVIEW_PROTOCOL.md`.
- `docs/engineering/COMPLIANCE_BASELINE.md` and `EXCEPTIONS.md`.
- Existing architecture checks, tests, Git hooks, CI workflows, and independent review skills.

Verify the current working tree and identify which controls are operational, merely configured, or still unverified.

## Responsibilities

### 1. Establish the validation matrix

Identify each enforcement boundary:

1. Deterministic architecture and coding checks.
2. Canonical verification commands.
3. Local Git hooks.
4. CI workflow execution.
5. Hosted required checks and merge protection.
6. Independent architectural review.
7. Acceptance and release-readiness controls.

For each boundary, identify its trigger, expected behaviour, observable evidence, and limitations.

### 2. Create controlled violations

Use isolated temporary fixtures, disposable checkouts, or test worktrees to introduce representative violations.

Test appropriate cases involving:

- Forbidden cross-feature imports or dependency cycles.
- Unauthorised database access.
- Invalid naming or structural conventions.
- Unapproved lint suppressions.
- Formatting, lint, or type-check failures.
- Missing required verification prerequisites.
- Failing tests or incorrect success-path assertions.
- Architectural or functional defects that static analysis cannot reliably detect.

Select cases that exercise distinct controls rather than duplicating existing tests unnecessarily.

Every test must include a corresponding compliant case.

### 3. Verify deterministic rejection

For each applicable violation:

- Execute the actual enforcement command.
- Confirm compliant code passes.
- Confirm violating code fails.
- Verify non-zero exit codes and actionable diagnostics.
- Verify unexpected errors cannot be reported as success.
- Confirm approved exceptions remain narrowly scoped.
- Confirm existing violations cannot silently expand or reappear after removal.

Do not count a test as successful if the detector rejected the fixture for an unrelated reason.

### 4. Verify Git hook activation

In a disposable checkout:

- Confirm the documented hook installation mechanism works.
- Attempt a real Git commit with compliant staged changes.
- Attempt a real Git commit containing a controlled violation.
- Verify the hook allows the compliant change and rejects the violation.
- Confirm that hooks do not depend on a particular AI coding assistant.

Do not create commits in the original repository.

### 5. Verify CI enforcement

Inspect the actual configured workflow and reproduce its verification stages in an isolated environment.

Confirm:

- Correct runtime and dependencies.
- Disposable database provisioning.
- Required migrations and generated artifacts.
- Execution of the canonical verification command.
- Failure propagation from mandatory checks.
- Availability of non-sensitive evidence.

Where hosted access permits, inspect an actual CI run.

**Do not claim hosted enforcement based solely on local simulation.**

If GitHub Actions has not run or the protected branch has no required status checks, report those boundaries as UNVERIFIED or MISSING.

Do not modify hosted settings.

### 6. Validate independent review

Using a genuinely separate reviewer context where supported:

- Provide a representative controlled architectural or functional defect.
- Confirm the reviewer examines source evidence rather than trusting the implementer's summary.
- Verify blocking defects produce CHANGES REQUIRED.
- Verify missing mandatory evidence produces BLOCKED.
- Verify decisions requiring owner approval produce ESCALATE.
- Confirm documented legacy findings are distinguished from newly introduced problems.

A self-review MUST NOT be presented as independent.

### 7. Validate release protection

Execute the actual available quality and acceptance verification commands.

Confirm that:

- Quality verification reports its genuine result.
- Failing acceptance tests remain visible.
- Release readiness does not become PASS while required acceptance criteria fail.
- Missing required release evidence cannot silently produce success.

For JPScents, preserve the three known D2–D4 acceptance failures until the approved application changes are implemented.

Do not change production behaviour or acceptance expectations.

### 8. Evaluate enforcement gaps

Classify each control as:

- **VERIFIED:** Tested successfully at its actual enforcement boundary.
- **FAILED:** Expected enforcement did not work.
- **CONFIGURED BUT UNVERIFIED:** Configuration exists, but operational behaviour was not established.
- **MISSING:** No effective mechanism exists.
- **BLOCKED:** Testing could not proceed because a necessary dependency, permission, or environment was unavailable.

Identify bypass paths, false negatives, misleading green results, and controls dependent on agent discretion.

Recommend corrective work without silently changing approved rules.

## Strictness Requirements

- Use isolated, reversible experiments.
- Never modify production or shared data.
- Never weaken a test, rule, exception, or verification contract to obtain a PASS.
- Never classify local simulation as proof of hosted enforcement.
- Never confuse an expected rejection with an infrastructure failure.
- Never claim independent review occurred without a separate reviewer.
- Do not introduce permanent violations into the application.
- Preserve the original working tree and existing approved specifications.
- Record exact commands, exit codes, and relevant evidence.
- Distinguish verified enforcement from advisory requirements.
- Do not modify merge protection, deploy, or perform destructive operations.

## Deliverables

Create:

`docs/engineering/GATE_VALIDATION.md`

Include:

1. Inspected commit, scope, and test environments.
2. Enforcement validation matrix.
3. Controlled violation scenarios and expected outcomes.
4. Actual commands, exit codes, and evidence.
5. Git hook and CI verification results.
6. Independent reviewer trial results.
7. Acceptance and release-readiness results.
8. Failures, bypasses, and outstanding limitations.
9. Final enforcement-readiness assessment.

You may add minimal reusable validation fixtures or test-only helpers where genuinely necessary.

Do not duplicate existing test coverage without justification.

## Validation

Before completion:

1. Run the applicable controlled experiments.
2. Confirm compliant and non-compliant outcomes.
3. Verify that tests failed for the intended reasons.
4. Confirm temporary modifications were removed.
5. Check that the original application code and approved contracts remain unchanged.
6. Verify the documentation accurately distinguishes observed, simulated, and unverified results.

If a control fails its intended enforcement test, document the failure rather than silently repairing or bypassing it.

## Execution Constraints

Modify only:

- The gate-validation document.
- Necessary isolated validation fixtures or test-only helpers.

Do not change application code, production configuration, existing enforcement scripts, Git hooks, CI workflows, approved specifications, ADRs, or exceptions.

Do not commit, push, merge, or deploy without explicit authorisation.

## Final Response Contract

Return no more than 120 words covering:

1. **Validated:** Number of controls and scenarios tested.
2. **Evidence:** Confirmed passing and failing enforcement behaviour.
3. **Gaps:** Failed, missing, or unverified enforcement boundaries.
4. **Readiness:** Whether local enforcement, hosted merge protection, and release protection are operational.
5. **Next step:** Whether Task 15 can begin.

Keep detailed results in repository documentation.
```

</content>
</page>
