# Task 13 independent-review trials

Trial date **2026-11-13**. Executor `/root/setup_execution` prepared disposable cases. Reviewer `/root/setup_review` separately loaded the [repository skill](../../../../.agents/skills/independent-review/SKILL.md), [protocol](../../REVIEW_PROTOCOL.md), Task 13 prompt, ARC-015/016 and the existing milestone review template. The review was explicitly invoked by its local skill path in the separate context. File discovery succeeded. Automatic rediscovery by an already-running client and other client surfaces were unverified.

- Protocol SHA-256 `07b571beb01d8999faa6f7820cdcaf88ade3bcea7cf24f42dc9c855467a86f9a`.
- Skill SHA-256 `ee3fdc44bdebf3847161cbd0a07b1f59145e7671b8d9a25f6cfc277f52b5b8e3`.
- Targeted Prettier and working-tree diff checks exited 0. The protected skill path required a narrowly scoped write escalation. Existing workflow, owner edit, accepted ADRs and live active milestone were preserved.

## Frozen trial inputs

Cases 01–04 were prepared at `/private/tmp/freemancodz-task13-DQu9yB`. Base and target files, SHA-256 manifests and actual relative diffs are present in each case. An empty diff in the authoring case proves the absence of fixture implementation. The separate hypothetical proposal is a review input.

| Case                      | Evidence inspected or available to the reviewer                                                                                                      | Diff SHA-256                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 01 functional defect      | Actual base/target source and Node TAP. `node --test --test-reporter=tap review-token.test.mjs` exited 1 on the target, one passing and one failing. | `01f0e1ba601de91b3c2e4633e4582482afc410f54c7baf07ff7c6e9c15dc71c7` |
| 02 missing evidence       | Comment-only fixture diff. The required separately produced quality receipt is absent.                                                               | `9335f81e118fa573dd889cd91185d328554592d6b5af2508ca6441d0e652c9fe` |
| 03 implemented unapproved | New runtime provider-client import beyond ADR-0002, isolated proposal and actual Task 09 scanner exit 1 with ARC-006.                                | `b49f6bf84ddc286443f4b4bca29cd6f6977d2cbc84b2cd714f3b5029d25ec36a` |
| 04 authoring proposal     | Proposed runtime import rule change. Dependent trial task stopped. Base and target implementation identical.                                         | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| 05 baseline comparison    | Same Task 12 commit as base and target, `a5a9d04a42b80cc65fcbc101e7ae9fb17898e0cc`, with verified quality receipt. No changed implementation.        | Empty committed diff                                               |

Case 01 retained TAP SHA-256 `6b69c69d66b69e5d56600e35b5a21556c76f3a59555f2b7d2370efb5ef1133d8`. Case 03 retained scanner log SHA-256 `bac143442a6e3d667acf09c3b6590f298ded2eb3021a665d08dbb692adb12037`. Case 05 reuses the [matching Task 12 quality receipt](task-12-results.md).

| Case and contract        | Base manifest SHA-256                                              | Target manifest SHA-256                                            |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 01 TRIAL-F v1            | `d72af18c7fdc96adedb0c6bab6e3aa2a77315be6350e8fe240b0b5794157f6d3` | `4f5976aec050c1eaa5648a3469671e0fc7db88a17d35e6c021c4f90fafe8935b` |
| 02 TRIAL-M v1            | `d72af18c7fdc96adedb0c6bab6e3aa2a77315be6350e8fe240b0b5794157f6d3` | `0a6e40c3a2f8f1b2fecded286bdcfb3ddc0dd6694fd3435dca323f277f9f23ef` |
| 03 TRIAL-U v1            | `35d60371c56c74757ec120ddd54612b54c9030abe5ae25d1958f6f1c1c04861a` | `45d9384827128eb5a4bc4fc6a7c1463f030832c18527b5c5134f9b86a9eefc5c` |
| 04 TRIAL-ADR-A authoring | `35d60371c56c74757ec120ddd54612b54c9030abe5ae25d1958f6f1c1c04861a` | `35d60371c56c74757ec120ddd54612b54c9030abe5ae25d1958f6f1c1c04861a` |

Case 03 proposal SHA-256 `89ec9176a0199bb06e19170498d62547dfb68f00f6eef12857ce149dcc96126b`. Case 04 proposal SHA-256 `20423f8ea53a178edadca2f3eb10d99dbca3275f51200ad51989f356cd85cea7`.

## Observed independent verdicts

| Case | Verdict                           | Finding and next action                                                                                                                                                                                                                                                                                                                                                      |
| ---- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01   | **CHANGES REQUIRED**              | **R13-001, High, Confirmed.** `review-token.mjs:2` omitted saved owner equality. TRIAL-F AC1/AC2 and ARC-008/011 require ownership. The reviewer repeated the real Node 22 TAP run and saw 1/2 pass. Restore owner equality and rerun the two cases before review.                                                                                                           |
| 02   | **BLOCKED**                       | **R13-002, Medium, Confirmed evidence gap.** TRIAL-M AC2 requires the absent `required-quality-evidence.json`. The reviewer verified the comment-only change preserves the checks and refused to substitute unrelated evidence.                                                                                                                                              |
| 03   | **BLOCKED**                       | **R13-003, High, Confirmed.** `src/modules/workflow/trial-notice.ts:1` imported a runtime error from the client implementation beyond ADR-0002. The independent scanner returned ARC-006 and exit 1. Owner approval, propagation and acknowledgement were absent. Stop TRIAL-U2 and return the authorized boundary correction or consequential proposal to the orchestrator. |
| 04   | **ESCALATE**                      | **R13-004, Medium, Confirmed proposed scope decision.** TRIAL-ADR-A would change ARC-006/007. The code snapshots matched, the proposal was unresolved and TRIAL-A2 remained stopped. Recommend retaining the injected boundary. A contrary proposal needs explicit owner decision and propagation before dependent work.                                                     |
| 05   | **PASS for the comparison scope** | The reviewer verified the clean Task 12 checkout and current quality evidence. The exact GAP-008 runtime client-file import is unchanged debt. Type-only Resend `Pick` and bounded inert Calendar errors fall within the existing D2 scope. No new defect or waiver was inferred.                                                                                            |

The reviewer independently matched the four fixture manifests, modes, diff hashes and available log hashes. These observed outcomes establish the protocol trial. None grants owner ADR approval or merge/release permission. The trial did not run the live milestone, edit its contract, post to a PR or exercise automatic client discovery.
