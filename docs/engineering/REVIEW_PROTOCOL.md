# Independent review protocol

Task 13 applies the existing ADR-0001 authority and ARC-015/016 approval contract. It defines review capability, not a new approval route, automatic agent hook or milestone implementation workflow. The author of a change cannot independently approve that change.

## Authority and canonical inputs

The orchestrator assigns a separate reviewer context, supplies a frozen scope and pauses changes to that snapshot during review. The reviewer treats the executor's summary as a claim to verify, reads the actual diff and affected dependencies, and returns findings without silently fixing implementation.

Read [AGENTS.md](../../AGENTS.md), the relevant [architecture](../architecture/ARCHITECTURE.md), [ADR registry](../architecture/adr/README.md), [coding standards](CODING_STANDARDS.md), [baseline](COMPLIANCE_BASELINE.md), [exceptions](EXCEPTIONS.md), [enforcement matrix](ENFORCEMENT_MATRIX.md), [integration coverage](INTEGRATION_VERIFICATION.md), [verification contract](VERIFICATION_CONTRACT.md) and [quality gates](QUALITY_GATES.md). For Next.js changes, also read the [architecture skill](../../.agents/skills/nextjs-architecture/SKILL.md) and consult the installed framework documentation where needed. Historical status text in an accepted specification is not current execution proof; use current revision-matched receipts and the setup ledger for observed capability.

Reuse the existing global `milestone-workflow` independent-review role and `references/review-template.md` when a real milestone invokes that workflow. Its PR posting, review count, frozen contract, recovery and human merge rules remain unchanged. The global examples naming another repository do not provide Freemancodz approvals or requirements. This task does not activate, edit or archive `.agents/milestones/active.md`. Task 15 will connect repository-specific evidence to that existing workflow.

## Minimum handoff and snapshot

The orchestrator supplies:

| Input                         | Required precision                                                                                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository and review purpose | Absolute working-copy path, requested scope, implementation/proposal/authoring phase; PR URL only if one actually exists                                                                                                            |
| Base and target               | Exact commit IDs and diff direction for committed work; for dirty/untracked or isolated fixture work, explicit base/target manifests with content hashes, file modes, additions/deletions and diff hash instead of invented commits |
| Complete reviewed changes     | Safe tracked diff, staged and unstaged changes, relevant untracked files, renames/deletions and prior findings; explicitly identify excluded owner changes                                                                          |
| Requirements                  | Full current contract/version, acceptance criteria, exclusions and required checks; document why a check is inapplicable to a narrow documentation/proposal review                                                                  |
| Architecture and approval     | Orchestrator and executor impact classifications, ARC/STD IDs, applicable accepted ADRs, exact owner evidence/version/scope, proposed decisions, affected/blocked task IDs, propagation and executor acknowledgement                |
| Evidence                      | Actual command, working directory, revision/input identity, exit, counts/skips, safe output/report paths or hosted run identity, known limitations and source of any third-party observation                                        |

Inspect path metadata before content. Never inspect secret-bearing files, credentials or unsafe symlink targets, including through a broad `git diff`, archive or search. Bound content reads to identified safe paths. If prohibited material is essential to a decision, mark that part BLOCKED and request a safe substitute through the orchestrator. Do not print sensitive values or run checks that implicitly load environment files or connect to an unknown DB/provider.

The reviewer independently confirms base, target and changed-file identity before assessing the diff and again before its verdict. A concurrent change invalidates the mixed review; stop and request a new frozen handoff. A Task 11 quality digest covers explicit safe inputs, not the complete index/review diff. Verify that report with `npm run verify:evidence -- quality /outside/report.json` in its exact checkout, and separately bind the full review scope. Task 15 will operationalize that full handoff binding; it is not claimed automatic here.

## Review procedure

1. Confirm reviewer independence, access, scope, snapshot and contract version. If an actual separate agent is unavailable, return BLOCKED; a second pass by the author is self-review.
2. Independently classify architecture impact as `NONE`, `EXISTING APPROVED ADR` or `NEW/REVISED ADR REQUIRED`. Map actual changes, not only the handoff's assertion, to applicable rules and acceptance criteria.
3. Apply the approval checkpoint below before crediting affected implementation. Verify exceptions against exact recorded scope; none may be inferred from existing code, passing tests or an accepted unrelated ADR.
4. Read the diff and risk-relevant callers, dependencies and tests. Prioritize changed behavior and important boundaries; do not exhaustively tour unchanged files or demand speculative refactors.
5. Inspect actual verification output and provenance. Reuse trustworthy matching runs; perform small safe checks where they resolve a concrete uncertainty. Required missing, stale, skipped, failed or inaccessible evidence is not PASS. Unit fakes prove their exercised seam, not live DB/provider/browser behavior.
6. Classify each finding against the base and precise baseline. Return routine corrections to the executor. Escalate consequential decisions through the orchestrator. Keep prior IDs and record resolution/rejection rationale across reviews.
7. Return the structured verdict for this exact scope and snapshot. The orchestrator checks the review itself, sends corrections for rework and obtains another independent review where required. Review PASS does not authorize merge, hosted changes or release.

## Criteria and proportional evidence

| Area                       | Concrete assessment                                                                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and dependencies | App/entrypoint thinness, module ownership, composition assembly, infrastructure factories, client/server graph, cross-module/type-only/inert-error boundaries under exact D2 scope                  |
| Functional correctness     | Each acceptance criterion, failure/edge paths, related-feature regressions, externally observable behavior and whether tests could pass while the behavior is wrong                                 |
| Data and concurrency       | Repository/transaction ownership, atomicity, ownership/revision checks, stale writes, durable claims/fences, retries and uncertain external effects; meaningful real-DB evidence when relevant      |
| Trust and errors           | Runtime input validation/inferred types, authorization, sensitive-data handling, safe actionable failures, logging and async completion/cancellation                                                |
| Maintainability and UI     | Cohesive responsibility, meaningful names, unnecessary layers/dependencies, duplication, accessibility/state and framework constraints; no arbitrary size limits or mandatory interface/class quota |
| Evidence and operations    | Required checks actually ran, counts/skips, deterministic vs semantic coverage, browser/provider/deployment boundaries, current hosted checks and separate release obligations                      |

Tests must assert behavior and important boundaries, including negative cases where risk requires them. A model/provider mock cannot establish external permissions, delivery or availability. A documented release or hosted prerequisite can remain blocked while an unrelated documentation review passes; label the scope so it cannot be read as engineering or release readiness.

Known debt is not a waiver. Match importer/target/binding/value-kind/count or exact formatter hash to the recorded baseline, and distinguish unchanged debt from added/increased occurrences. D2's erased technical ports and bounded inert public errors are legitimate variations; client-file runtime errors and private Meeting helper/config imports remain debt. A pending approved implementation is not already complete. No ecommerce D2–D4 product changes exist here; catalogue examples are not repository findings.

## Mandatory ADR checkpoint

Use the [catalogue contract](setup/prompts/catalogue.md#mandatory-adr-approval-contract), ARC-015/016 and the single ADR registry. The reviewer verifies:

1. Both orchestrator and executor assessments exist for affected tasks, with the actual dependency/trust/transaction implications considered.
2. Every new/revised rule or exception has a proposed ADR and exact blocked work before dependent implementation. Approval must be an explicit authorized human decision tied to the reviewed version/hash and bounded scope. Silence, an “accepted” filename, an executor statement or green CI is not approval.
3. An accepted decision's contracts, task instructions, checks and execution handoff agree; executor acknowledgement precedes recorded resumption. Future scheduled work is not mislabeled complete, and unrelated approved decisions do not cover the change.
4. Missing acceptance or inconsistent propagation prevents affected PASS/READY FOR MERGE. An authoring-stage new proposal requires ESCALATE before implementation. If already-implemented work lacks required acceptance, return BLOCKED, identify the unauthorized scope and send the proposed-decision/correction brief through the orchestrator; do not retrospectively bless it.
5. Owner architecture/standards approval is distinct from later merge, hosted and release authorization. Review cannot grant any of them. An unaffected review may continue only if it does not constrain the pending decision.

The escalation brief states the concrete problem, recommended smallest option, alternatives/trade-offs, rule/ADR IDs, evidence, affected task IDs and exactly what stops. Routine compliant corrections do not need a new owner decision. Consequential contract changes, exceptions/suppressions, conflicting requirements, material privacy/data-integrity risks or destructive operations require the existing owner process.

## Findings and outcomes

Use stable IDs such as `R13-001`; retain them across rework. Every material finding records severity, confidence (`Confirmed`, `Probable`, `Unverified`), exact repository-relative path/symbol/line or evidence reference, violated ARC/STD/ADR/acceptance criterion, base-versus-target classification, impact and smallest corrective action. For temporary fixtures, paths are relative to the named fixture target and explicitly labeled as trial evidence.

| Severity | Meaning                                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Critical | Demonstrated severe security/privacy loss, destructive data corruption or equivalent immediate risk; blocks completion           |
| High     | Material correctness, authorization, consistency or architectural contract breach; blocks affected completion                    |
| Medium   | Meaningful requirement/test/maintainability gap with a concrete impact; state explicitly whether it blocks the scoped acceptance |
| Low      | Local non-blocking improvement supported by evidence; no personal-style or hypothetical redesign demands                         |

Confidence is separate from severity. A probable risk should identify the cheapest confirming check. Required unavailable evidence can block completion without pretending a defect is confirmed. Classify findings as newly introduced defect, unchanged baseline debt, approved work pending, approved scoped exception, legitimate variation or unverified risk. Explain any changed severity or disposition instead of silently dropping a finding.

| Outcome              | Required meaning                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PASS**             | No blocking findings; every applicable required criterion and evidence obligation is satisfied for the exact reviewed scope; approval/propagation coverage is verified |
| **CHANGES REQUIRED** | Confirmed blocking implementation/test defects need correction and independent re-review; ordinary repairs go directly to the executor                                 |
| **BLOCKED**          | Required evidence, access, independence, identity or accepted approval/propagation is unavailable; name the prerequisite and affected work                             |
| **ESCALATE**         | A consequential decision or authoring-stage proposal needs the owner; provide the brief and stop dependent work                                                        |

Record multiple blocking conditions when present; do not conceal a confirmed defect behind a missing-evidence label. Use a primary outcome reflecting the next required action. An already pending owner decision is BLOCKED for affected implementation; a new proposal needing presentation is ESCALATE. Neither permits PASS or READY FOR MERGE.

For an invoked milestone, preserve its existing PR template/wrapper: only a protocol PASS with all milestone requirements satisfied can support its `APPROVE`; other outcomes prevent approval and retain their detailed reason in the review. Do not reset review counts, post outside authorized scope, or replace the workflow's final decision. A proposal-quality PASS would only approve the reviewability of a brief, never adoption of that proposal.

## Reviewer response and retained evidence

Use this compact shape; attach detailed findings/evidence in the authorized repository or PR review record:

```text
Outcome: PASS | CHANGES REQUIRED | BLOCKED | ESCALATE
Scope/phase; reviewer identity and independence:
Base / target / diff identity; contract version:
Architecture: classification, rule/ADR mapping, owner scope/version, propagation, blocked tasks
Acceptance: criterion -> PASS / FAIL / NOT VERIFIED -> direct evidence
Blocking findings: ID, severity/confidence, category, path:line, requirement, impact, correction
Non-blocking recommendations / unchanged debt / legitimate variations:
Evidence examined: actual commands/exits/counts, report/run identity, independent probes
Prior finding dispositions:
Required corrections or owner decisions; exact stopped work:
Remaining uncertainty and separate merge/release status:
```

The reviewer may inspect and safely test, request corrections, recommend decisions and issue the scoped verdict. It must not change product code, approve architecture, grant exceptions, weaken checks, rewrite standards, merge/deploy or claim an absent second-agent review. Preserve original execution evidence; do not reconstruct missing logs as if they were retained outputs.

## Invocation and trial evidence

The repository-local [independent-review skill](../../.agents/skills/independent-review/SKILL.md) is the explicit reusable entry point. Supply its absolute path to a separate agent with this handoff; reading a skill and producing a review in that agent demonstrates explicit invocation. A newly added skill may not appear in an already-running client's startup catalogue until rediscovery. No client-specific automatic discovery, hook activation or workflow integration is inferred from file presence.

Task 13's isolated trials use non-production inputs with actual base/target manifests, diffs and observed checks. Fixture proposals are explicitly unapproved and cannot authorize live work. The separate reviewer assesses a controlled functional defect, missing mandatory evidence, implemented unapproved architecture, an authoring proposal that stops dependent work, and unchanged baseline/legitimate variation. Actual invocations, findings and outcomes are retained in [Task 13 review trials](setup/evidence/task-13-review-trials.md) and the setup review ledger. Pending trials are not described as passed. Task 15 remains responsible for integrating this protocol with milestone authoring/execution/handoff.
