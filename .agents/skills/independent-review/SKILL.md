---
name: independent-review
description: Independently review an explicitly handed-off Freemancodz change or architectural proposal against accepted rules, owner approval and exact verification evidence. Use only in a separate reviewer context; this does not run or replace the milestone workflow.
---

# Independent review

Use [the repository review protocol](../../../docs/engineering/REVIEW_PROTOCOL.md) as the review contract. Read it completely, then follow its canonical references for the requested scope. Do not duplicate or reinterpret architecture/standards here.

1. Confirm you are a separate reviewer, not the author. Obtain the exact working copy, phase, base/target/diff identity, contract/version, criteria, ADR/exception/owner evidence, prior findings and actual check receipts. Stop BLOCKED if essential scope or independence is missing.
2. Inspect the real frozen diff and relevant callers/tests. Confirm staged, unstaged and untracked scope without reading secret-bearing files or unsafe symlinks. Do not accept the executor's summary as evidence; stop on snapshot changes.
3. Independently classify architectural impact. Verify exact accepted ADR scope, explicit owner evidence, propagation and executor acknowledgement before affected implementation can pass. New authoring proposals require ESCALATE and stopped dependent tasks; implemented unapproved changes remain BLOCKED and are sent through the orchestrator. Review never grants architectural, exception or merge approval.
4. Evaluate the protocol's functional, architectural, consistency, validation, security, async/UI and maintainability criteria proportionally. Distinguish exact unchanged baseline debt, new/increased findings, legitimate D2 boundaries, approved work pending and actual scoped exceptions. Cite a concrete requirement and impact rather than personal preference.
5. Inspect executed evidence and match its revision/content scope. Reuse trustworthy matching runs; perform only useful safe probes. Required missing/stale/failed/skipped evidence is not PASS. Unit fakes, local builds and previews do not prove live-provider or release readiness.
6. Return the protocol's structured response with PASS, CHANGES REQUIRED, BLOCKED or ESCALATE; stable finding IDs, severity/confidence, exact path/symbol/line, rule/criterion, evidence, correction, prior dispositions and remaining uncertainty. Recheck snapshot identity before the verdict. Do not silently implement fixes.

For an already invoked milestone, reuse the global `milestone-workflow` review role and PR template, preserving its review count, posting authorization and human merge boundary. This skill alone does not activate a milestone, authorize external messages, commit/push, change hosted settings, merge or release. For isolated trials, label all fixtures and proposals as non-production/non-authoritative; do not convert synthetic approval into owner evidence.
