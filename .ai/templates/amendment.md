# Milestone N Amendment X: Title

**Status:** Draft  
**Version:** 1.0.0  
**Last Updated:** YYYY-MM-DD  
**Parent Milestone:** `.ai/milestones/milestone-N.md`  
**Target Pull Request:** `#`  
**Target Branch:** `branch-name`  
**Cycle Scope:** `milestone-N-amendment-X`  
**Maximum Amendment Cycles:** `3`

## Reason

Explain why the current milestone and pull request need this bounded correction or extension.

## Changed requirements

- Exact addition or correction
- Exact behaviour affected

## Behaviour that must not change

- Existing behaviour one
- Existing behaviour two

## Explicitly out of scope

- Unrelated refactoring
- Future milestone work

## Required tests

1. Focused amendment behaviour
2. Relevant regression coverage
3. Existing tests remain green

## Acceptance criteria

Include only criteria the implementation and review agents can verify from repository evidence, automated tests, CI or accessible runtime behaviour.

- [ ] The amendment requirement works.
- [ ] Unchanged parent milestone requirements still hold.
- [ ] No unrelated work was introduced.
- [ ] Validation passes.
- [ ] The independent review covers the parent milestone and amendment.
- [ ] The pull request is not merged by an agent.

## Manual tasks

List only new or changed human actions introduced by this amendment. Use `None` when not required.

1. Manual task or command to run.

## Manual acceptance criteria

These are confirmed by the human after the workflow reaches `ready_for_human`. They do not block the agent workflow from reaching that state.

- [ ] Human-verifiable amendment outcome one.
