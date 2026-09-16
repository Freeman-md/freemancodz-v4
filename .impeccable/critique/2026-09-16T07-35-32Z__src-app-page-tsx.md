---
target: homepage
total_score: 21
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 2
target_identity: "file:/Users/freemancodz/Projects/freemancodz-v4/src/app/page.tsx"
target_fingerprint: "sha256:514bbfde4b561d28dafc673c986af288bf9d1587a93c1e218a108a56f0c1a22f"
target_path: /Users/freemancodz/Projects/freemancodz-v4/src/app/page.tsx
timestamp: 2026-09-16T07-35-32Z
slug: src-app-page-tsx
---
Method: dual-agent (A: `/root/homepage_design_critique` · B: `/root/homepage_detector_critique`)

## Design specificity

The homepage has a distinctive idea: connecting customer-facing products with the operational work behind them. Freeman's portrait, the WithRadius interface and concrete project evidence make that credible. Floating icon tiles, repeated diagram panels and the abstract friction-to-success illustration are more interchangeable. Simplify the existing page rather than replacing its design.

The detector returned zero findings and zero advisories across 31 relevant TSX files. No false positives. Browser inspection nevertheless exposed misleading destinations and an assistant-control issue. No injected overlay was available.

## Design health: 21/36 — Acceptable

Qualitative usability assessment, not a compliance score. Heuristic 7 excluded.

| # | Heuristic | Score | Main finding |
|---|---|---:|---|
| 1 | System status | 3 | Thinking feedback is visible. |
| 2 | Real-world language | 3 | Concrete examples help; abstract framing remains. |
| 3 | User control | 2 | Header Assistant auto-submits; desktop dismissal restricted while loading. |
| 4 | Consistency | 2 | Differently labelled project links share destinations. |
| 5 | Error prevention | 2 | Submission safeguards exist; misleading labels cause wrong turns. |
| 6 | Recognition | 3 | Clear navigation and project structure; next-step assistant role unclear. |
| 7 | Efficiency | n/a | No power-user requirement for this marketing surface. |
| 8 | Minimalism | 2 | Repeated explanation and floating UI compete with proof. |
| 9 | Error recovery | 2 | Source exposes errors; recovery could be clearer; failure not exercised. |
| 10 | Contextual help | 2 | Assistant discoverable but invitation undersells client guidance. |
| | Total | 21/36 | 58%, Acceptable |

## Overall impression

Professional and coherent, but slower than a prospective client's decision requires. Bring evidence closer to the claim, with less repeated explanation.

## What's working

- Portrait and existing visual identity establish personal accountability.
- Real project imagery and Problem/Solution/Outcome give tangible evidence.
- Personal review, clear timing and not needing to prescribe a technical solution lower enquiry friction.

## Priority issues

1. **[P1] Project links promise choices they do not deliver.** Pay4Me Case Study/Live both open withradius.com; Portfolio Assistant Case Study/Live Assistant both open its GitHub repository; Email PA's two links share its repository. Source: HomeRelevantWorkSection.tsx:21,45,46,64,65; Pay4MeFeaturedProject.tsx:14,22,26,29. Fix: accurately label destinations, remove duplicates, open existing assistant for Try the assistant. No invented case studies. Command: `$impeccable clarify`.
2. **[P1] Header Assistant unexpectedly sends a message.** A observed one click auto-submit the canned I would like to talk message, then disabled desktop close. Source Navbar.tsx:63-68; useFloatingPanel.ts:104-106,144-145; ChatComposer.tsx:83. Fix generic open-only trigger and permit visual dismissal independently of request processing; preserve explicit workflow-start intent. Command: `$impeccable harden`.
3. **[P2] Collapsed launcher competes with content.** Fixed bottom-centre black pill overlaps content during scrolling; invitation truncates desktop/mobile. Source FloatingPortfolioChat.tsx and ChatLauncher.tsx:32-33. Fix shorter invitation, smaller footprint or placement outside central reading path; preserve conversation interface. Commands: `$impeccable quieter`, `$impeccable adapt`.
4. **[P2] Oversized Improve explanation delays proof.** Two large journey diagrams restate hero positioning. Source HomeImproveSection.tsx and page order src/app/page.tsx. Fix shorter two-part explanation, fewer diagram elements and less vertical space; preserve customer/operations relationship. Commands: `$impeccable distill`, `$impeccable layout`.
5. **[P2] Audit ending repeats rather than advances argument.** HomeAuditSection and HomeClosingSection repeat friction, invitation, timing and illustration. Fix keep concrete example and brief final invitation; simplify boxed details paragraph and duplicate closing visual. Command: `$impeccable distill`.

## Cognitive load and emotional journey

Moderate: three checklist failures (single focus, chunking five audience labels, minimal choices with duplicated project links). Grouping, hierarchy, one local decision, working memory and progressive disclosure generally pass. Journey nodes are two grouped explanatory sequences, not eight competing actions. Emotional path: personal credibility; valley through abstract explanation; peak at real project proof; useful audit reassurance; repetition lengthens ending and unexpected assistant submission interrupts control.

## Persona red flags

- Jordan: Live Assistant leads to code; header button speaks before visitor chooses a question.
- Riley: duplicate destinations undermine promised evidence.
- Casey: mobile primary buttons fit well, but supporting links have about 20px-high targets and five audience labels delay portrait.

## Minor observations

Mobile observed at 390x844 has no horizontal overflow. Secondary project/footer links merit touch-target review; measured height alone is not a WCAG verdict. Static assistant preview cramped on desktop. Arrow-only submit lacks explicit accessible name in source. Desktop observed 1280x720. Backend failure, bookings and audit intake not exercised. Mobile open-sheet/keyboard experience not tested. One inspection click unexpectedly submitted a non-sensitive canned message; no typed personal enquiry or contact data.

## Questions to consider

- Does each illustration explain something adjacent copy cannot?
- Should clients see real work before the full explanation of the approach?
