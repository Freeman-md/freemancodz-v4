# Branch and Pull-Request Lifecycle

## Repository discovery

Before changing Git state:

1. identify the repository root
2. inspect the current branch and working tree
3. inspect remotes and the remote default branch
4. fetch current remote state
5. inspect existing milestone branches and pull requests

Do not assume the default branch is `main` or the remote is `origin`.

## New milestone

Every new milestone uses a dedicated branch created from the latest remote default-branch head.

Before creating it:

1. confirm the previous milestone pull request is merged or otherwise resolved
2. fetch and prune the relevant remote
3. switch to the local default branch
4. fast-forward it from the remote default branch
5. confirm the working tree contains no unrelated changes
6. delete the merged remote milestone branch when safe and still present
7. delete the merged local milestone branch when fully merged
8. prune stale remote-tracking references
9. create the new branch from the updated default branch

Never create a milestone branch from:

- a previous milestone branch
- an amendment branch
- a detached HEAD
- an outdated local default branch
- an unclean tree containing unrelated work

Use a clear branch name based on the milestone, for example:

```text
feat/milestone-3-short-title
fix/milestone-4-short-title
```

Follow stricter repository naming rules when present.

## Amendments

An amendment reuses the parent milestone's existing branch and pull request unless the human explicitly directs otherwise.

Do not create a duplicate branch or pull request for an amendment.

## Pull requests

Before opening a pull request, search for an existing PR from the current branch.

- reuse an existing open PR
- do not create duplicate PRs
- target the repository default branch unless the contract says otherwise
- include goal, scope, validation, limitations and manual verification
- do not claim checks passed unless evidence exists

## Safety

Never:

- force-push unless the human explicitly approves it
- discard uncommitted user work
- commit secrets, environment files or private payloads
- merge the pull request
- delete an unmerged branch containing unique work

When the working tree is unsafe, stop and report the exact issue instead of guessing.

## Resume behaviour

If a branch or PR already exists, inspect it and resume from the current state. Do not recreate completed commits, branches or pull requests.
