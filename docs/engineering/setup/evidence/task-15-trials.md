# Task 15 milestone integration trials

The executor `/root/setup_execution` prepared isolated trial contracts and handoffs using the existing global authoring and workflow templates. No live milestone, branch or milestone PR was started. The independently reviewed application evidence comes from the exact corrected Task 14 candidate. The [integration procedure](../../MILESTONE_INTEGRATION.md) applies to real milestone entrypoints.

## Frozen inputs

The trial directory is `/private/tmp/freemancodz-task15-b7ujngwh`. The canonical candidate's exact base and target are both `413957e395948e3e48f20e53625f23ddfddf9e1b`. Its 322-file full safe review manifest covers modes, index, worktree, local skills and reviewed paths outside the 288-file quality identity. The committed, staged and unstaged patches are empty for this frozen candidate. A separate disposable Git fixture exercises nonempty staged/unstaged patches and untracked content.

| Artifact                                              | SHA-256                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| Trial contract                                        | `70bf4fffd7053a4e8b5dffc89471e890e20a8960c63e91a6deccd1dda874fda9` |
| Candidate snapshot                                    | `3b37c9a7e6ccb6345e397e550b5baaacc5f9993ca581da3061e99133b4bf2b9f` |
| Trial cases                                           | `1211e1c9047b9f48e783cbb1e43ccc969d236eca0453319d5a3e0a2f45ed0f5b` |
| Executed commands and outcomes                        | `448592669ea4d8aa93973cbcdab3dbb1dc284476853a229cd40dd3474c8fe10d` |
| Partial index/worktree snapshot                       | `94c3fa04c69e988a23dbe1a48b0fa16410488aea6a6b62d2370f7a3be42daf54` |
| Changed untracked snapshot                            | `0739e7798fbce07b46ee3d8d45a8d40ecbbc5340057701ab1957863e607cfb83` |
| Authoring draft with no architecture impact           | `27a9332ea182d62f21f4761562ee0cce39966a8fae03246f53ed1f7263b3428d` |
| Authoring draft with proposed ADR                     | `1e44a3b78937a8d508670fef08c70f697cda8e96a9079df273dd43b3d0023b2a` |
| Planning, discovery and actual approval reuse handoff | `590caa8e417803cf6cfd61277966aede96b50ad326c11b676c1859db1d521506` |

The executor invoked the real evidence CLI against the current candidate reports. Matching quality and acceptance each exited 0. Failed, malformed and stale copies each exited 1. The separate owner-equality fixture failed its actual Node test (exit 1), then passed both tests after the scoped correction (exit 0). No fresh database or browser run was needed to consume the same [matching Task 14 reports](task-14-correction.md).

The reviewer identified an ambiguity in the proposed-ADR fixture's Manual Checkpoint. The executor set it to `None` and retained the owner decision solely at the pre-dispatch architecture gate. The original fixture hash above is historical. The corrected fixture SHA-256 is `511f5f45a66931c19d367adae04dd4f3f2dbce8bc5dd9c4f16049348659eddc8`.

## Independent trial outcomes

Reviewer `/root/setup_review` explicitly invoked the repository skill in a separate context and independently checked the input hashes, actual Git states and executed receipts.

| Case                                   | Verdict and observation                                                                                                                                                                                                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T15-01 matching handoff                | **PASS** for the isolated corrected candidate. The reviewer recomputed the 322-file safe snapshot and invoked both matching evidence commands. Both exited 0.                                                                                                                                                       |
| T15-02 invalid required evidence       | **BLOCKED**, R15-003 Medium/Confirmed. Failed, malformed and stale copies each rejected with exit 1. A genuine current report is required.                                                                                                                                                                          |
| T15-03 absent independent review       | **BLOCKED**, R15-004 Medium/Confirmed. The pre-delegation handoff has valid reports and no independent verdict. The other cases do not satisfy this handoff.                                                                                                                                                        |
| T15-04a and T15-04b correction loop    | **CHANGES REQUIRED → scoped PASS**. R15-001 High/Confirmed at `defect/review-token.mjs:2`, TRIAL AC3 and ARC-008/011. Missing owner equality failed a real test. The corrected version restored the condition and independently passed 2/2. Finding closed. These were isolated reviews, not live PR review passes. |
| T15-05 authoring and planning          | **PASS** for screening. Actual draft classified NONE, retained unchecked criteria and stayed outside the active path. Planning matched the bounded scope.                                                                                                                                                           |
| T15-06 proposal and executor discovery | **ESCALATE**, R15-005 Medium/Confirmed pending decision under ARC-007/015. The executor independently raised the excluded cross-module edge. X1 stayed blocked and unimplemented. Unaffected X2 evidence inventory could proceed. The fixture correction R15-002 kept the decision at the pre-dispatch gate.        |
| T15-07 actual approval and propagation | **PASS** for exact existing scope. Real APPROVAL-001, Task 04 propagation and the acknowledged Task 05 handoff establish prior approved resumption. The new hypothetical decision still requires its own owner approval. Separate merge approval remains absent.                                                    |
| T15-08 snapshot mutation               | **PASS** for the snapshot procedure. The actual bad index and good worktree were distinct. Altering an untracked path invalidated the old review identity. That stale handoff remained blocked.                                                                                                                     |

The reviewer verified seven retained logs, two report hashes and four controlled source/test hashes. The candidate snapshot and Git fixture were rechecked, and the owner file remained preserved. These trials exercised the local checkpoints and explicit separate review. A real future milestone PR, automatic client discovery, owner merge and release were outside scope.
