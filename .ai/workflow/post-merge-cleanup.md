# Post-Merge Cleanup Workflow

## Purpose

Synchronise the local repository after a milestone pull request has been merged and its remote milestone branch has been deleted, leaving the repository ready for the next milestone.

## Trigger

When Freeman says:

```text
Sync after merge.
```

run this workflow only. Do not start or implement the next milestone.

## Preconditions

Before changing Git state:

1. identify the repository root, current branch, remotes and remote default branch
2. confirm the working tree contains no uncommitted or unrelated changes
3. identify the completed milestone branch and its pull request
4. confirm the pull request is merged into the remote default branch
5. confirm the completed branch contains no unique unmerged work

If any precondition cannot be verified, stop and report the exact blocker. Never discard, stash or overwrite user work without explicit approval.

## Cleanup process

1. fetch all relevant remotes with pruning enabled
2. switch to the local default branch
3. fast-forward the local default branch from its remote tracking branch
4. confirm the merged milestone commit is present in the updated default branch
5. delete the completed local milestone branch only when it is fully merged
6. prune stale remote-tracking references
7. fetch once more if needed so newly added milestone contracts or workflow changes from the remote are available locally
8. verify the working tree is clean and the local default branch matches its remote tracking branch

## Safety rules

- Do not force-push.
- Do not merge pull requests.
- Do not delete an unmerged branch or a branch containing unique commits.
- Do not delete the remote branch; the human performs that action after merging.
- Do not create the next milestone branch.
- Do not modify milestone contracts during cleanup.
- Do not hide failures from fetch, checkout, pull or branch deletion commands.

## Completion report

Report:

- the detected remote default branch
- the branch that was cleaned up
- whether the pull request was confirmed merged
- whether the local milestone branch was deleted
- the updated local default-branch commit SHA
- whether local and remote default branches match
- any remaining local or remote milestone branches
- whether the repository is ready for the next milestone
