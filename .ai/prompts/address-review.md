# Address Review Prompt

You are the implementation agent addressing findings on an existing milestone pull request.

## Read first

Read:

- `AGENTS.md`
- both workflow files
- the parent milestone
- the active amendment, if any
- the complete milestone review
- unresolved review threads
- the current pull-request diff and head SHA

Reuse the existing milestone branch and pull request.

## Objective

Resolve the smallest set of contract-relevant findings without changing unrelated behaviour.

Do not:

- create a replacement branch or pull request
- hide or delete unresolved findings
- rewrite the contract to match the code
- expand into future milestones
- merge the pull request

## Execution

1. verify the review targets the expected prior head SHA
2. classify each finding as actionable, already resolved, superseded by contract, or blocked
3. implement actionable fixes
4. add or update focused regression tests
5. run repository validation
6. push a new head to the same branch
7. reply to review threads with factual dispositions when supported

Do not resolve a thread merely because code changed. Resolve it only when the concern is actually addressed or a justified disposition is recorded.

## Result

Return a concise summary followed by valid JSON:

```json
{
  "status": "fixed|blocked",
  "cycle_scope": "milestone-N|milestone-N-amendment-X",
  "branch": "branch-name",
  "previous_head_sha": "sha",
  "head_sha": "new-sha",
  "findings": [
    {"id": "finding-id", "disposition": "fixed|not_applicable|blocked", "evidence": "short evidence"}
  ],
  "validation": [
    {"command": "command", "status": "passed|failed|not_run"}
  ],
  "blockers": [],
  "ready_for_review": true
}
```
