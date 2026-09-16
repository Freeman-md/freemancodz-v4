# Freeman Madudili Portfolio

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary audience is prospective clients evaluating Freeman as an engineering partner. They need to understand what he does, see relevant work, identify how it relates to their own customer journey or operational problem, and take an appropriate next step.

Freeman is the sole administrator responsible for maintaining portfolio content and media.

## Product Purpose

Help prospective clients understand Freeman's engineering work and decide whether it is relevant to their needs. Success means a visitor can connect their problem to credible evidence of his work and move naturally into an enquiry, audit request, or meeting.

The AI assistant is improved incrementally to help clients understand what Freeman does and guide them easily to the next step within the conversation.

## Positioning

Freeman builds customer-facing products and the operational workflows behind them. The portfolio connects these two parts of the work through real projects, his engineering approach, and an assistant grounded in portfolio evidence.

The entry offer is a free, personally reviewed customer-journey/workflow audit delivered within 48 hours. It examines one important journey or workflow rather than promising a comprehensive business transformation.

## Operating Context

- Public visitors explore Home, Work, About, and Audit, with the floating assistant available across the site.
- The assistant supports portfolio questions, audit intake, and meeting booking. The audit is personally reviewed by Freeman; the assistant guides intake rather than replacing that review.
- Freeman manages content and uploads media through the protected admin. Existing local and production database workflows support maintaining the site.
- Paper Design is Freeman's preferred design workspace. In this project workspace, "Design Orchestrator | Agent" helps produce implementation prompts or direct "Design | Agent". Future design work should coordinate with those existing tasks where relevant, not introduce a competing design workflow.

## Capabilities and Constraints

- Preserve the existing content-retrieval and rendering architecture unless an approved task requires a change.
- PostgreSQL-backed portfolio content is the canonical runtime source; seed data is bootstrap input, not a parallel runtime catalogue.
- The admin-managed Profile is the sole public source for social links and the profile cover image. Do not add static identity fallbacks.
- Managed images and media can be uploaded through the admin and rendered publicly from Supabase Storage. Image optimization should remain available where appropriate.
- The assistant's responsive presentation and its backend capabilities are separate concerns. A UI-only change must not silently change its logic or workflows.
- No CV feature or CV link is needed on the site at present.
- Prefer the smallest coherent implementation. Do not add generic page builders, unnecessary services, or speculative infrastructure for a small portfolio.

## Brand Commitments

The public identity is Freeman Madudili, with Freemancodz logo assets already present in the repository. Preserve factual copy, personal identity, and existing assets during scoped refinements unless Freeman approves a change.

The current direction is simplification of the existing site, not a redesign from scratch. Remove redundant communication and unnecessary decoration without discarding useful evidence or working interactions.

## Evidence on Hand

- Project content in `prisma/portfolio-seed-data.ts` and the admin-managed database includes Pay4Me / WithRadius, Portfolio Assistant, Email PA, AcrossTheHorizon, Shifty, and Self-Healing Backend Operations System.
- The same seed source includes Freeman's experience, personal story, working approach, and audit offer. Runtime content may have been updated through the admin; do not treat seed copy as the latest database state.
- Existing logo, project, and Outside Engineering image assets are under `public/images/`; managed replacements live in Supabase Storage.
- `docs/portfolio-content-system.md` and `docs/workflow-foundation.md` describe the existing content and assistant workflow boundaries.

Do not invent testimonials, client endorsements, project results, performance claims, or new service commitments. Use approved content and actual evidence.

## Product Principles

1. Make Freeman's work and its relevance understandable to prospective clients.
2. Connect claims to real project evidence rather than decorative complexity.
3. Guide visitors to an appropriate next step with as little friction as possible, including within the assistant.
4. Simplify and improve incrementally; preserve useful content and working behaviour outside the approved scope.
5. Keep ownership clear: admin-managed content is canonical, and implementation complexity must earn its place.
