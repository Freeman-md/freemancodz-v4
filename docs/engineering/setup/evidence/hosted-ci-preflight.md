# Hosted CI prerequisites

Read-only GitHub API checks on 2026-11-13 confirmed that `Freeman-md/freemancodz-v4` has Actions enabled, `main` points to `f6ea50c13fbf245d4f0403c697c98f27cbd4f3f5`, and active ruleset 19097664 currently applies `deletion` and `non_fast_forward`. The branch rule query returned no required status check. See the [original hosted audit](hosted-audit.json) for the ruleset details.

GitHub's release and commit endpoints returned the following signed commits. Task 12 can use the full pins for the proposed quality workflow.

| Action                    | Published release                                                        | Commit                                     |
| ------------------------- | ------------------------------------------------------------------------ | ------------------------------------------ |
| `actions/checkout`        | [v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1)        | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/setup-node`      | [v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0)      | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| `actions/upload-artifact` | [v7.0.2](https://github.com/actions/upload-artifact/releases/tag/v7.0.2) | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |

The [GitHub repository rules API](https://docs.github.com/en/rest/repos/rules) requires the actual check context and supports binding it to the observed integration ID. The first real CI run will supply that identity. The active ruleset should retain its existing deletion and force-update rules in any owner-authorized change.

An additional read-only API inspection on 2026-11-13 returned repository administration and push permissions for the authenticated operator, zero open PRs, and disabled auto-merge. It returned both Production and Preview deployment records. These observations establish capability and a possible deployment side effect of a branch push. Owner authorisation is required for publication and hosted rule changes. Vercel documents that a branch push or PR can automatically create a Preview deployment. [Vercel Git deployments](https://vercel.com/docs/git)

The same inspection confirmed Actions is enabled with a read-only default workflow token, and Actions cannot approve pull request reviews. `staging` was unprotected at `5ae5f9eb6f687735924e837270afa9a99fca0bde`; its branch-rule query returned no rules. `main` is the protected-branch push target for Task 12.

The full branch listing showed `main` as the only protected branch. The proposed `engineering-setup` branch was absent. The authenticated operator's existing GitHub OAuth scopes include `repo` and `workflow`. Capability inspection did not mutate the repository.

The read-only GitHub environments endpoint returned `Preview` and `Production` with no GitHub protection rules or deployment branch policy. Vercel's separate promotion configuration was not verified by that endpoint.

The hosted trial needs the actual PR test-merge SHA, the reported check context and GitHub Actions app identity, and a check run that completed successfully in this repository within seven days. The hosted ruleset evidence must show the required check bound to that app, strict freshness, and the existing deletion and non-fast-forward rules. Observe a required check failing on a controlled PR revision and passing on the corrected revision. GitHub can evaluate the test-merge SHA in preference to the PR head SHA. [GitHub required check troubleshooting](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)

Use the read-only `CheckRun.isRequired` for the trial PR or `gh pr checks --required` to distinguish a failed required check from an advisory failure. Capture rule and PR evidence while the negative and corrected revisions are each current. This trial requires no attempted merge. [GitHub GraphQL checks](https://docs.github.com/en/graphql/reference/checks) · [GitHub CLI check inspection](https://cli.github.com/manual/gh_pr_checks)
