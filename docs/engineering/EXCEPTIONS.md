# Freemancodz V4 exception registry

Task07 · recorded **2026-11-13** · inspected HEAD `f6ea50c13fbf245d4f0403c697c98f27cbd4f3f5` plus the preserved constants edit.

## Approved exceptions

**None evidenced.** [APPROVAL-001](setup/APPROVALS.md#approval-001--d1-and-d2-approved) accepts D1/D2 only and expressly excludes exceptions; [APPROVAL-002](setup/APPROVALS.md#approval-002--coding-standards-approved) adopts the coding standards/refinements while retaining the applicable exception/architecture/hosted/Git/merge/release approval boundaries. The [ADR registry](../architecture/adr/README.md) contains two accepted decisions and no accepted exception record.

Accordingly there are no approved exception IDs, affected-rule waivers, locations, expiry dates or review conditions to invent. No owner is being asked to approve a legacy waiver merely because code already exists.

## Proposed exceptions

**None proposed.** The [compliance baseline](COMPLIANCE_BASELINE.md) identifies confirmed debt with exact scope and recommends remediation or a strict non-regression comparison where applicable. No concrete necessity has been established for an exception. If later remediation genuinely requires a new boundary or deviation, stop only its dependent work and use the owner decision process before implementation.

The distinction is deliberate:

| Record or observation                   | What it does not authorise                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| GAP-001–024 legacy debt                 | No rule waiver, broad file ignore, increased occurrence count or permission to add similar violations.                                           |
| Accepted D2 and GAP-035/036             | No arbitrary runtime infrastructure/module import; only the exact approved contract applies. A legitimate permitted pattern is not an exception. |
| GAP-025/026 approved work pending       | No claim that instruction propagation/trials already happened; planned implementation is not a waiver.                                           |
| Verification gaps / UNVERIFIED findings | No fabricated PASS, skipped mandatory stage or silent standards change.                                                                          |
| A future non-regression baseline        | No assertion of full compliance, nor permission to bypass a gate requiring full compliance.                                                      |
| Existing ESLint ignores or test skips   | No inferred architectural exemption. Generated code/vendor/build artifacts and missing prerequisites must be assessed in their actual scope.     |

Targeted source search found no `eslint-disable`, `@ts-ignore` or `@ts-expect-error` directive in inspected authored `src`/test TypeScript/JavaScript files. This is bounded source evidence, not proof there are no suppressions elsewhere or that configured ignores have owner exception status. Existing `src/generated/prisma/**` and `supabase/.temp/**` lint exclusions and formatter build/dependency exclusions are tool scope, not acceptance of application debt.

## Recording, review and supersession

This registry implements navigation for [ARC-015/016](../architecture/ARCHITECTURE.md#shared-adr-approval-and-milestone-contract), STD-024 and the [shared ADR lifecycle](../architecture/adr/README.md#shared-lifecycle-and-agent-handoff); it creates no parallel approval authority.

1. A concrete request receives the next stable `EXC-001` identifier only when a request exists. Record primary status **PROPOSED EXCEPTION**, exact ARC/STD IDs, file paths/symbols/behaviour and any occurrence/content boundary. A planned ID is not an existing exception.
2. State the current pressure, alternatives/remediation considered, why a narrower fix is insufficient, risks and compensating verification. Identify originating milestone/task IDs and exactly what work is blocked. Every proposed exception requires a linked **PROPOSED — AWAITING APPROVAL** ADR under ARC-015, with the same exact scoped owner decision required before affected work; the obligation is not conditional on whether the deviation also changes architecture.
3. Only explicit owner/authorised human APPROVE can change the record to **APPROVED EXCEPTION**. Record evidence/reference, approval date, reviewed version and precise scope, affected tasks and review/expiry/removal conditions actually established. Do not infer approval from silence, reviewer PASS, implementation, broad setup continuation or passing checks.
4. Propagate accepted scope to the applicable architecture/standards, baseline, task/handoff and verification requirements before resuming dependent work. The executor acknowledges; independent review verifies scope and evidence. A proposed or rejected exception cannot be used as an allowlist.
5. Recheck an exception whenever its scoped code/rule or established review condition changes. Remove or supersede it with traceable evidence; preserve history and link successor/predecessor. Never silently broaden a path, rule, count, behaviour or lifetime, and do not invent expiry dates absent a decision.
6. Architecture/exception approval never implies permission to commit, push, merge, alter hosted controls or release. Each remains subject to its own authorised scope and evidence.

Current approved/proposed exception count is **0 / 0**. Independent Task07 review remains the next gate; no Task08 work, remediation or exception adoption is performed by this register.
