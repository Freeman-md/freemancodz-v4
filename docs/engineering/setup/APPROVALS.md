# Owner decision evidence

This log preserves explicit owner responses for the initial engineering setup. It is evidence for the single `docs/architecture/adr/` registry and the catalogue lifecycle, not a separate approval authority. Agent review, passing checks and implementation never substitute for the owner response. Dates use Europe/London.

## APPROVAL-001 — D1 and D2 approved

- Date received: **2026-11-13**.
- Authority: repository owner, explicit response in this Codex chat.
- Source: `send_user_message_question_reply`, question item `["request_user_input_async","call_9d8e1a8159d643ea98ceca482e6eef77",0]`.
- Exact answer: **“Approve both proposals (Recommended)”**.
- Decision: **APPROVE D1 / ADR-0001 and D2 / ADR-0002**.

The question named [ADR-0001](../../architecture/adr/0001-canonical-architecture-authority.md) (canonical architecture contract and shared ADR process) and [ADR-0002](../../architecture/adr/0002-injected-ports-and-inert-errors.md) (narrow technical types and inert error contracts). It expressly retained existing violations as debt and stated that approval permits recording/propagation and Task 05, without approving exceptions, hosted changes, merge or release.

The owner-approved proposal versions were independently reviewed in [Task 04 review pass 2](REVIEWS.md#task-04--proposal-review-pass-2-ready-for-owner-decision). Their SHA-256 hashes were rechecked unchanged immediately after the response:

| Artifact                                                         | Approved proposal SHA-256                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| `docs/architecture/ARCHITECTURE.md`                              | `c815dafa397535e56e794c1cb83905fb642229732519374bc07bb316d51a8a51` |
| `docs/architecture/adr/0001-canonical-architecture-authority.md` | `c0ed89224ea70e8d9ff30278bf0ffd16ea892aeee3c558173c66622a525689ad` |
| `docs/architecture/adr/0002-injected-ports-and-inert-errors.md`  | `5ce9a2e6b9d328e66e864c6e336ed9368e9c9515f7ea33fd8f216d80f66d3409` |

Accepted scope is exactly D1 and D2 in those reviewed proposals. Approval metadata may now be propagated without changing their normative substance. D2's explicit owner acceptance governs only its recorded ARC-006/ARC-007 change to the current architecture skill until the scheduled Task 08 alignment. Other AGENTS/skill requirements remain binding. There is no legacy waiver, new feature scope, or permission to silently broaden the accepted rule.

Affected tasks: finish Task 04 approval propagation and independently verify it; then author/review Task 05. Tasks 06–16 retain their own prerequisites, verification and applicable approval gates. Task 05 coding standards require their own owner approval before adoption.

Required minimum propagation: accepted ADR and architecture status/evidence; setup checklist; Task 05 input/check requirements and later-update schedule; matching executor acknowledgement; independent verification of this propagation. No dependent Task 05 work resumes until these agree. Actual completion is recorded in the checklist and review log, not inferred by this approval record.

Merge/release/hosted changes/exception approvals: **NOT GIVEN**. No commit or push is authorised by this decision.

## APPROVAL-002 — Coding standards approved

- Date received: **2026-11-13**.
- Authority: repository owner, explicit response in this Codex chat.
- Source: owner-created goal immediately following the Task 05 approval request.
- Exact response: **“Approved. Proceed until you're done with the setup, thanks”**.
- Decision: **APPROVE adoption of Task 05 and CS-D1 through CS-D3**.

The owner also confirmed this decision in `send_user_message_question_reply`, question item `["request_user_input_async","call_6d3041d2a7554f3ea295da5f72bba15b",0]`, with the exact answer **“Approve the standards (Recommended)”**. The confirmation refers to the same reviewed proposal and scope.

The request identified the independently reviewed [coding standards](../CODING_STANDARDS.md), covering naming/import/type conventions, responsibility-based complexity review, and scoped accessibility and asynchronous work requirements. The reviewed proposal SHA-256, rechecked immediately after approval, was `5e8d23dba92608e29db68308ca51d4a55d68f3c96d4ebeddb939fb092b24b09b`. See the [independent review](REVIEWS.md#task-05--proposal-review-pass-1-ready-for-owner-decision).

The approved standards preserve the accepted ARC rules, the ADR-0002 boundaries and existing debt. Task 05 propagates the approved scope and prepares the Task 06 handoff. The owner directs continued setup work through Task 16. Material architecture changes, exceptions, hosted settings, Git publication, merge and release retain their applicable approval requirements.

## APPROVAL-003 — Draft PR and required hosted quality check

- Date received: **2026-11-13**.
- Authority: repository owner, explicit response in this Codex chat.
- Source: `send_user_message_question_reply`, question item `["request_user_input_async","call_8c2035cc582947e789efbc76fa7bd5e9",0]`.
- Exact answer: **“Approve the draft PR and required check (Recommended)”**.

The owner authorized committing and pushing the reviewed setup changes to `engineering-setup` and opening a draft PR against `main`, excluding the owner's chat rate-limit edit. The branch/PR can trigger a Vercel Preview. Once real GitHub Actions succeeds, the owner authorized updating the existing main ruleset to require a PR and the current `Engineering quality` check from GitHub Actions, with strict freshness and no bypass. Existing deletion and force-push protections are preserved. A controlled failing and corrected PR revision are within the approved trial.

The [reviewed Task 12 proposal](../QUALITY_GATES.md) was SHA-256 `4fd014170fd31cee64d43052dc2160e6c90d4ed4d92e0cec30b765297543a7c0`. A later trial found evidence schema defects. Publication followed [independent correction verification](REVIEWS.md#task-14--corrected-local-enforcement-validation-pass). The reviewed setup branch opened [draft PR #32](https://github.com/Freeman-md/freemancodz-v4/pull/32), initially at `a17810861b954e1414b9ae443a8714be91e81ce3`. The first real hosted pass supplied the exact check context and app ID before the approved ruleset was applied. The [hosted trial](evidence/hosted-quality-trial.md) and [independent review](REVIEWS.md#tasks-12-and-14--hosted-required-check-trial-pass) record the resulting required failure and recovery. This approval grants no merge or production release authority.
