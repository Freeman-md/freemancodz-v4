# Repository Engineering Instructions

This file contains repository-specific engineering rules and the entry point for the milestone workflow.

## Project-specific rules

Replace this section with the target project's real standards, including where relevant:

- architecture and module boundaries
- coding style and naming
- validation boundaries
- security and privacy rules
- testing conventions
- build, lint, typecheck and test commands
- dependency rules
- repository structure
- pull-request expectations

Do not keep example rules that do not apply to the target repository.

## Engineering defaults

Unless the repository defines stricter rules:

- prefer the smallest correct change
- reuse existing code and architecture where practical
- avoid speculative abstractions
- keep scope limited to the active milestone
- do not hide assumptions
- do not change unrelated behaviour
- add focused regression tests for bug fixes when practical
- inspect the repository before choosing commands or structure

## Milestone workflow trigger

When Freeman says:

```text
Run the active milestone.
```

execute the complete workflow defined by:

- this file
- `.ai/README.md`
- `.ai/prompts/orchestrator.md`
- `.ai/workflow/lifecycle.md`
- `.ai/workflow/branch-lifecycle.md`
- the active contract in `.ai/milestones/`
- any active amendment for that milestone
- the current Git, pull-request, review and CI state

Resume from the current state. Do not restart completed work.

Continue until one of these terminal states is reached:

- `ready_for_human`
- `blocked`
- `escalated`

Do not merge the pull request.
Do not create duplicate branches or pull requests.
Do not modify checklist boxes in milestone contracts.
Do not begin a future milestone.

## Post-merge cleanup trigger

After Freeman has merged the completed milestone pull request and deleted its remote feature branch, when Freeman says:

```text
Sync after merge.
```

execute `.ai/workflow/post-merge-cleanup.md`.

This workflow must:

- verify the pull request was merged
- protect uncommitted and unmerged work
- fetch and prune the remotes
- switch to the repository's local default branch
- fast-forward it from the remote default branch
- delete the completed local milestone branch only when it is fully merged
- confirm the local default branch matches the remote
- stop without creating or starting the next milestone

## Instruction precedence

When instructions conflict, use this order:

1. platform and security constraints
2. this `AGENTS.md`
3. `.ai/architecture/*.md`, when present
4. `.ai/workflow/*.md`
5. the active parent milestone
6. an active amendment, only for sections it changes
7. implementation, review and quality prompts
8. pull-request descriptions and agent summaries
9. Future branches shouldn't have codex in them. For example /codex/feat/milestone-1-foundation should rather be /feat/milestone-1-foundation.

Pull-request descriptions and summaries are not evidence of correctness.
