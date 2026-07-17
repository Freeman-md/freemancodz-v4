# Milestone Lifecycle

## Purpose

The orchestrator resumes work from repository evidence rather than assuming a fresh run.

## States

```text
pending
implementing
pr_open
reviewing
changes_requested
fixing
ready_for_human
blocked
escalated
```

Normal flow:

```text
pending
→ implementing
→ pr_open
→ reviewing
→ changes_requested
→ fixing
→ reviewing
→ ready_for_human
```

Terminal states:

- `ready_for_human`
- `blocked`
- `escalated`

## State detection

Determine state from the active contract, Git branch, open pull request, current head SHA, review comments, unresolved threads, CI status and prior machine-readable agent results.

Do not trust an implementation summary when repository evidence disagrees.

## Start rules

A milestone may begin only when:

- exactly one relevant contract is `Active`, or the human names the contract
- no earlier milestone has an unmerged pull request unless this work is an amendment to it
- the working tree is safe to use
- branch-lifecycle requirements can be satisfied

Freeze the contract as implementation starts.

## Implementation-review cycle

A cycle consists of:

1. implementation or review-fix pass
2. validation
3. push to the milestone branch
4. independent review of the exact head SHA
5. orchestrator parsing of the review result

Default maximum: three implementation-review cycles per parent milestone.

An explicitly approved amendment receives its own maximum of three cycles. Preserve the parent cycle history.

## Review result handling

When review returns `REQUEST_CHANGES` or equivalent blocking findings:

- confirm the review targets the current head SHA
- route only contract-relevant findings to the review-fix agent
- preserve unresolved findings and previous cycle history
- run validation and review again

Do not open a replacement pull request to avoid findings.

Manual tasks and manual acceptance criteria are human handoff items. Pending manual work must not be converted into review findings or additional implementation cycles unless repository evidence shows the implementation required to support that manual step is missing or incorrect.

## Ready-for-human gate

Set `ready_for_human` only when all required conditions are true:

- review verdict is `APPROVE`
- review targets the current pull-request head SHA
- `ready_for_human` is true in the review result
- the complete milestone review was posted to the pull request
- blocker count is zero
- high-severity count is zero
- required CI checks pass on the reviewed SHA
- no unresolved review thread remains without a documented valid disposition
- every agent-verifiable acceptance criterion is `PASS` or explicitly `NOT VERIFIED`
- every required quality agent configured by the repository has passed
- all pending manual tasks and manual acceptance criteria are listed for the human

Manual tasks and manual acceptance criteria do not have to be completed for the workflow to reach `ready_for_human`.

Do not invoke another implementation or review agent after this gate passes.

## Blocked

Use `blocked` when safe implementation progress requires unavailable credentials, permissions, infrastructure, external systems or missing human-provided information.

Do not use `blocked` merely because a contract contains a manual task that is intentionally deferred until `ready_for_human`.

Report:

- exact blocker
- evidence
- work already completed
- smallest action needed from the human

## Escalated

Use `escalated` when:

- the active cycle budget is exhausted
- findings conflict with the contract
- a behavioural or architectural decision requires human approval
- repeated fixes are not resolving the same issue

Do not silently expand scope.

## Archival

A milestone becomes `Archived` only after its pull request is merged.

Before starting the next milestone, complete branch cleanup under `branch-lifecycle.md`.
