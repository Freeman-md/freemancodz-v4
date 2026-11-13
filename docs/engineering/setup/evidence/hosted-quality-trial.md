# Hosted engineering quality trial

Repository `Freeman-md/freemancodz-v4`, 2026-11-13. [APPROVAL-003](../APPROVALS.md#approval-003--draft-pr-and-required-hosted-quality-check) authorized the reviewed draft publication, strict main ruleset update and controlled failing/corrected trial. [Draft PR #32](https://github.com/Freeman-md/freemancodz-v4/pull/32) targets `main` from `engineering-setup`. Publication used a separate checkout from exact base `f6ea50c13fbf245d4f0403c697c98f27cbd4f3f5`; its 78 staged files were hash and mode checked. The original committed chat constants blob `dba8b3c542fdbbc50b238ae2bb34f4fcf67e1e77` remains on the branch. The live owner edit retains `e9e2e1fc3bf6d4055a0ee13547624aca7e785f3b`.

The staged manifest SHA-256 is `19833199f6b0c32238089a6b379c524d1d20f71ebec022882493538c1778a32a`. Three retained raw approval diffs intentionally contain the single-space marker for blank unified-diff context lines. Their exact bytes were preserved. The other staged paths passed the Git whitespace check.

## Initial real Actions success

- PR head `a17810861b954e1414b9ae443a8714be91e81ce3`; checked-out test merge `0ed3c94d135f852bffaccd14143e19f836079cc4`. [Actions run 43445101458](https://github.com/Freeman-md/freemancodz-v4/actions/runs/43445101458) concluded success.
- [Job 131952373779](https://github.com/Freeman-md/freemancodz-v4/actions/runs/43445101458/job/131952373779) ran the locked install, exact Docker image, canonical quality, matching evidence validation and artifact upload on Linux x64 with Node 22.17.0. All 16 stages passed, including 39 unit, 48 tooling and 65 database tests, 23 migrations, production webpack build and verified cleanup. No skips were reported.
- Report SHA-256 `c7b8fbe2609ed340875afb36faf862d382a9734cbb3ef07ff86b7074a5ddc06d`, hosted checkout digest `adb03f62f73ea3fddbca5a5f20e3c5d1fa57afa42caa8714869c10a612e55d1f` across 288 inputs. The Checks API attaches the job to the PR head. The report records the exact checked-out merge commit.
- The job's exact context was `Engineering quality`, app slug `github-actions`, app integration ID `15368`. The PR revision produced a Vercel check, initially pending. It is separate from the required quality result.

## Owner-approved ruleset update

The existing active `main` ruleset `19097664` was read immediately before and after the approved update. The branch-effective rules endpoint verified that deletion and non-fast-forward protections stayed active, and that a PR and the strict `Engineering quality` check bound to app `15368` are now required. The bypass list is empty. Allowed merge methods remain merge, squash and rebase. The required approving-review count is zero for the solo-maintainer repository. Independent review and the owner's separate merge decision remain required by the repository workflow.

On the initial green revision, `gh pr checks 32 --required` returned the exact hosted check as required and SUCCESS. GitHub reported the PR merge state clean. The PR remained draft. No merge was attempted.

The read-only before/after and branch-effective results are retained under `/private/tmp/freemancodz-approved-publication.2svGXT/`. SHA-256 values: `ruleset-before.json` `6193852cb9e915e02a0a1a52177321556bfc1c7228cf35d41381744c93852e15`, `ruleset-applied.json` `70c43ccf79338c7017f65e483a729b1bd1b334cb8c77bc0f344dd923203212f1`, and `main-rules-applied.json` `8fa994caab09d318e2d33b9b145655af71be87d1492c5462876d4f569a82d693`.

## Controlled required-check rejection

The controlled head `638cd96805cc49518b6327523e56da43a6eda68e` added one unformatted Markdown fixture. [Actions run 43445802789](https://github.com/Freeman-md/freemancodz-v4/actions/runs/43445802789) tested merge `eff23cdd3cbd072926d373f4485023461ea52ff7`. The format stage alone failed with exit 1. The canonical gate and evidence validator both failed. The artifact upload succeeded and retained the FAIL report, SHA-256 `60bedfdb60df2b887aeb26ee176712aa4d29248b91f162d0239e64bf39b47100`.

While the failed revision was current, the Checks API returned job `131954778503` as a failure from app `15368`, `gh pr checks 32 --required` returned `Engineering quality` in FAILURE state, and the PR API returned merge state `blocked`. The test remained a draft and no merge was attempted. Removing the temporary fixture restored the exact reviewed tree at `b4d9dca88bae9e8ceedd183834378fd57e502422`. That corrected revision was pushed for a fresh hosted run.

## Corrected required check and Preview

[Actions run 43446489186](https://github.com/Freeman-md/freemancodz-v4/actions/runs/43446489186) concluded success at corrected head `b4d9dca88bae9e8ceedd183834378fd57e502422` and tested merge `54c7dfe7bcc136c127682baa3783cc1122354191`. [Job 131957171451](https://github.com/Freeman-md/freemancodz-v4/actions/runs/43446489186/job/131957171451) passed all 16 stages and the evidence step. The downloaded report SHA-256 is `ddcbf922e6ded98a287dcdd5eb389910858e06fc92682629f335f89068e3ff44`. Its 288-file digest matches the initial hosted success, and Git verified that the corrected head tree equals the original reviewed draft tree. There were 39 unit, 48 tooling and 65 DB passes, zero skips, 23 migrations and verified fixture cleanup.

GitHub again reported `Engineering quality` as required and SUCCESS, with PR merge state `clean` and draft flag true. Read-back of effective main rules matched the applied rules. The observed `main` commit was still `f6ea50c13fbf245d4f0403c697c98f27cbd4f3f5`. The main push trigger is configured and linted. It was not exercised because the trial did not change `main`.

The GitHub deployment API classified deployment `7768239267` as Preview for the restored head, and its deployment status returned success. No browser smoke or live-provider verification was performed on that Preview. [Exact revision Preview](https://freemancodz-v4-2xdgehzm4-freemanmds-projects.vercel.app) · [Vercel deployment record](https://vercel.com/freemanmds-projects/freemancodz-v4/FKkaQY8JMoxxpTxbdGWNqnKYgW7A)

The real PR required-check trial demonstrated failure and recovery without a merge attempt. Production promotion and release remain separately blocked.
