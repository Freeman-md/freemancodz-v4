# Milestone 16: Portfolio Frontend Integration & Content Admin

**Status:** Archived
**Version:** 1.0.0  
**Last Updated:** 2026-08-18
**Depends On:** Milestone 15  
**Target Pull Request:** [#17](https://github.com/Freeman-md/freemancodz-v4/pull/17)
**Target Branch:** `feat/milestone-16-portfolio-frontend-content-admin`  
**Superseded By:** —

## Goal

Complete the portfolio content-system transition started in Milestone 15 by connecting the live `/`, `/work`, `/about` and `/audit` pages to the canonical portfolio backend, adding static-like public caching with targeted on-demand invalidation, and providing a Freeman-only content admin backed by Supabase Auth and the existing portfolio module.

At completion:

1. the four public pages render approved database-backed content while preserving their existing presentation and intentionally static frontend content;
2. normal public requests do not perform unnecessary uncached Prisma reads;
3. one authorised admin can sign in with passwordless Supabase Auth at `/admin`;
4. the admin can edit the approved portfolio content model without becoming a page builder or generic database editor;
5. managed media can be uploaded/replaced safely through the existing Supabase Storage architecture;
6. successful writes invalidate only the relevant public cache dependencies so updated content appears without redeployment; and
7. `docs/portfolio-content-system.md` explains the completed Milestone 15 + 16 architecture, operations and verification flow in a concise durable repository guide.

This milestone deliberately combines frontend integration, public caching, authentication, the write layer, the admin UI and media management into one milestone. Do not split the approved outcome into a Milestone 16 + Milestone 17 pair. Preserve the strict phase checkpoints in this contract so the public read architecture is completed and verified before the admin/write architecture is added.

---

## Current dependency state and start gate

Milestone 15 PR #16 has been merged into `main`. The implementation branch must not be treated as the implementation source after merge; the final merged default branch is authoritative.

At the time this Draft contract is created, `.ai/milestones/milestone-15.md` still records `Status: Frozen` even though PR #16 is merged. Milestone 16 may exist as `Draft`, but implementation must not begin while that workflow state remains inconsistent.

Before Milestone 16 becomes `Active`/`Frozen` and before any implementation code is written:

- confirm Milestone 15 is merged;
- confirm Milestone 15 is archived/reconciled according to repository workflow;
- start from the latest remote default-branch head, never from the old Milestone 15 branch;
- re-read the final merged Milestone 15 implementation rather than relying on the previously inspected head SHA;
- reconcile this contract against any final merged interface differences before coding; and
- surface a genuine contract/interface contradiction rather than silently inventing a new domain model.

Do not modify the old Milestone 15 branch.

---

## Source of truth

Read these sources before implementation and use them in this order for portfolio architecture/content decisions:

1. `AGENTS.md`
2. `.agents/skills/nextjs-architecture/SKILL.md`
3. `.ai/README.md` and `.ai/workflow/**`
4. this milestone contract
5. the final merged Milestone 15 contract and implementation on the default branch
6. the nine approved Notion artifacts under `FreemancodzV4`
7. current repository evidence

The nine authoritative Notion artifacts are:

1. `Domain Model`
2. `Homepage Mapping`
3. `Work Page Mapping`
4. `About Page Mapping`
5. `Audit Page Mapping`
6. `Homepage Seed Data`
7. `Work Page Seed Data`
8. `About Page Seed Data`
9. `Audit Page Seed Data`

The Domain Model defines content concepts. Page Mappings define allocation/composition and frontend-only/static exceptions. Seed Data defines canonical initial values, ordering, Projects, Experiences, Profile collections, ActionBlocks, MediaBlocks, `Project.visualText` and `Project.visualBlock`.

Do not recover canonical content from stale JSX when an approved Notion value exists. Do not convert intentionally static frontend content into database content merely because it appears visually on a page.

---

## Final merged Milestone 15 surface to verify in Phase 0

The currently merged backend exposes the four page-service interfaces and composed page types through `src/server/modules/portfolio/public.ts`.

Expected repository boundaries are:

- `ProfileRepository`
- `ContentBlockRepository`
- `IconBlockRepository`
- `MediaBlockRepository`
- `ActionBlockRepository`
- `ProjectRepository`
- `ExperienceRepository`

Expected page services are:

- `HomeService` / `IHomeService`
- `WorkService` / `IWorkService`
- `AboutService` / `IAboutService`
- `AuditService` / `IAuditService`

Each currently exposes `getPageData()`.

Expected page compositions are:

```text
HomePageData
├── profile
├── contentBlocks
└── projects

WorkPageData
├── profile
├── contentBlocks
└── projects

AboutPageData
├── profile
├── contentBlocks
└── experiences

AuditPageData
├── contentBlocks
└── projects
```

Use the final merged code as truth if any name or shape changes before implementation starts.

No Prisma schema change is currently expected in Milestone 16. If an approved requirement cannot be implemented without a schema change, stop and surface the contract issue rather than silently extending the domain.

---

## Approved architectural decisions

These decisions are already approved. Do not re-open them unless implementation discovers a genuine technical contradiction.

### Public rendering

Use the installed Next.js 16 Cache Components architecture. Before implementation, inspect the installed Next.js version and its matching bundled official documentation as required by `AGENTS.md`.

Target behaviour:

```text
Public request
→ cached/static-like page data
→ no unnecessary Prisma query on every normal request

cache miss / invalidation
→ page service
→ repositories
→ Prisma
→ PostgreSQL
```

Use the current supported equivalents of:

- `cacheComponents`
- `use cache`
- `cacheTag`
- targeted on-demand invalidation

Do not use pure build-only SSG that requires redeployment for content changes. Do not leave all four public pages as request-time uncached Prisma reads. Do not broadly invalidate the whole site after every admin mutation.

### Cache invalidation

Tags are the primary data-dependency mechanism.

Use the current supported semantics of:

- `updateTag()` for Server Action mutations where immediate read-your-own-write behaviour is appropriate;
- `revalidateTag()` for Route Handler mutations where that boundary is appropriate; and
- `revalidatePath()` only where path-specific invalidation is genuinely useful.

Never invalidate before persistence succeeds.

Do not blindly call `revalidatePath("/")` after every mutation.

### Admin implementation stack

Do not add Refine.

Use the existing application architecture with the minimum additional maintained dependencies required for:

- Next.js App Router
- shadcn/ui
- React Hook Form
- Zod
- Server Actions
- protected Route Handlers where appropriate

If React Hook Form/resolver packages are absent, add only the packages actually used.

The admin must use the application's existing backend architecture directly. Do not introduce an unnecessary `Refine → Data Provider → HTTP CRUD` layer.

### Authentication and authorization

Use Supabase Auth for authentication and application-owned Freeman-only authorization.

Approved admin email:

```text
freemanmadudili@gmail.com
```

Use the current Supabase SSR/cookie pattern appropriate to the installed packages and Next.js version. Passwordless/magic-link email is the login mechanism. There is no public registration UI and no Prisma `Admin` model.

Authentication answers who the user is. Authorization separately verifies that the authenticated account is the one approved admin account.

### Admin product boundary

The admin is not:

- Webflow;
- a page builder;
- a generic Prisma table editor;
- an arbitrary visual composer;
- a React-code editor; or
- a theme/CSS editor.

The database owns approved content. The frontend continues to own layout, React components, responsive behaviour, diagrams, connectors, animation and custom visual code.

---

# Implementation phases

Implementation must preserve these dependency checkpoints:

0. Preflight against final merged Milestone 15
1. Public presentation adapters and registries
2. Public frontend integration
3. Cache Components and dependency tagging
4. Supabase Auth plus write application layer
5. Portfolio-specific admin UI
6. Media mutation lifecycle
7. End-to-end verification and durable handoff documentation

Tests may be developed alongside each phase. Do not artificially defer all testing to Phase 7. The checkpoint rule means the architecture of a preceding phase must be coherent and validated before dependent later phases are built on top of it.

---

# Phase 0 — Preflight against merged Milestone 15

Before coding:

1. verify Milestone 15 is merged and its workflow state is archived/reconciled;
2. fetch/prune and begin from the current remote default branch according to `.ai/workflow/branch-lifecycle.md`;
3. inspect the installed Next.js version and matching bundled official docs for Cache Components, Server Actions, Proxy and revalidation behaviour;
4. inspect the final merged:
   - Prisma schema and migration;
   - canonical seed/bootstrap implementation;
   - portfolio repository interfaces and implementations;
   - page services and page-data types;
   - composition root;
   - Supabase Storage provider/client;
   - package scripts and environment configuration;
   - current public routes/components;
   - current `src/proxy.ts`;
   - current Next.js configuration;
   - shadcn/ui setup;
   - current assistant trigger contract/mechanism;
   - current test suites;
5. verify all nine Notion source-of-truth artifacts remain accessible; and
6. record any merged Milestone 15 difference that changes this contract before implementation proceeds.

Do not implement against an assumed stale SHA.

Checkpoint: the final read/storage interfaces, page compositions, route structure and framework-specific cache/auth approach are verified against the actual merged repository.

---

# Phase 1 — Public presentation adapters and registries

Milestone 15 returns domain-oriented `contentBlocks[]`. The frontend must not scatter fragile array-index assumptions such as `contentBlocks[3]` across section components.

## Page presentation adapters

Create deterministic frontend/application presentation mapping for:

- Home
- Work
- About
- Audit

Conceptually:

```text
HomePageData
→ HomePresentationData
   ├── hero
   ├── improve
   ├── relevantWork
   ├── audit
   └── closing
```

Do equivalent mapping for the other pages.

Use stable identities already represented by approved data, especially known ContentBlock URLs/anchors and seeded hierarchy. Do not add a Prisma `key` field merely to make frontend lookup easier. If an existing stable field is insufficient, solve the identity problem in the application/presentation registry first and surface a contract issue before changing persistence.

## Known-section renderer boundary

Where useful, map known approved root sections to existing React section components:

```text
known ContentBlock URL / semantic section
→ existing React section component
```

Requirements:

- only known approved sections render;
- database `order` may determine ordering among supported known sections where the page design supports it;
- unknown arbitrary ContentBlocks must not instantiate arbitrary UI;
- database values never contain executable React code;
- the frontend owns the section renderer/registry; and
- the completed selector strategy is documented in the system guide.

## Lucide icon resolver

Create one safe canonical Lucide icon-resolution mechanism shared by public rendering and the future admin picker.

Requirements:

- valid known `IconBlock.iconName` resolves to the intended component;
- invalid/unknown values fail safely;
- no JSX/components are stored in PostgreSQL;
- no repeated local switch statements across page sections;
- admin and public rendering share canonical icon-name validation; and
- avoid unnecessarily shipping the entire Lucide bundle to every public page if a narrower registry/import strategy is appropriate.

## Project visual registry

Create one explicit registry for contexts that consume stored `Project.visualBlock` identifiers.

Current approved identifiers include:

- `Pay4MeVisual`
- `PortfolioAssistantVisual`
- `EmailWorkflowVisual`

The registry must:

- map only known identifiers to existing React visual implementations;
- fail safely when an identifier is missing or unknown;
- never perform arbitrary dynamic imports based on untrusted database strings; and
- expose the same valid identifier set to the admin selector later in the milestone.

Important: `Project.visualBlock` is not the only possible visual representation of a Project.

Example:

```text
Portfolio Assistant
├── Audit → Project.visualBlock → PortfolioAssistantVisual
└── Home/Work → PortfolioAssistantPreview
```

Keep page-specific custom visuals where mappings say they are presentation code. Do not force all Project presentations through the registry.

## ActionBlock presentation adapter

Create one consistent ActionBlock rendering/interaction boundary.

Support approved semantics:

- URL action → normal navigation/link behaviour;
- `assistantMessage` action → existing assistant-trigger mechanism;
- preserve label, variant, URL, assistantMessage and semantic content icon where applicable;
- decorative arrows/button icons stay presentation-only.

Reuse the existing assistant trigger event/contract. Do not introduce a second assistant event system.

Checkpoint: all four page-result shapes can be transformed into semantic presentation data without array-index identity, icons resolve safely, visualBlock values resolve through a closed registry, and ActionBlocks have one consistent rendering contract.

---

# Phase 2 — Convert all four public pages

Keep public routes Server Component-oriented. Routes obtain the appropriate cached page data and provide semantic presentation data to existing section components. Do not convert the site into a client-rendered data-fetching application.

## Homepage `/`

Consume `HomeService.getPageData()` through the final configured composition-root/cache pattern.

Database-backed content must include:

- Hero title/copy/actions;
- `Profile.audience`;
- `Profile.coverImage`;
- What I Help Improve parent content;
- Customer Journeys child content and IconBlocks;
- Operational Workflows child content and IconBlocks;
- Relevant Work heading/action;
- canonical Pay4Me / WithRadius, Portfolio Assistant and Email PA Projects;
- Free Audit content and IconBlocks;
- Free Audit Problem child content/icons;
- Free Audit Improvement child content/icons; and
- Final CTA content/action.

Preserve frontend presentation including:

- HeroSignalCards;
- portrait treatment;
- Handoff visuals/connectors;
- project shells;
- Portfolio Assistant preview;
- Email workflow preview;
- Audit diagram treatment;
- FrictionResolutionVisual; and
- current responsive behaviour.

Preserve approved static frontend content, including:

- `The handoff that drives outcomes`;
- `Right action. Right next step.`;
- Free Audit `Main friction` / `First improvement` visual labels;
- `Personally reviewed · Delivered within 48 hours`;
- `The full Audit page explains exactly what’s reviewed and what you receive.`;
- `See the full details` link treatment; and
- `Free · Personally reviewed · Delivered within 48 hours`.

Do not migrate those static exceptions into PostgreSQL.

## Work `/work`

Consume `WorkService.getPageData()`.

Database-backed content must include:

- Hero, Focus and Approach;
- Relevant Work;
- canonical Projects;
- Additional Work heading;
- Shifty Project data where approved;
- Self-Healing Backend Operations System Project data where approved;
- How the Work Connects parent/children;
- `Profile.outcomes`;
- Final CTA content;
- ActionBlocks/IconBlocks.

Canonical Project values must replace duplicated dynamic frontend strings. The stale display value `Self-Healing Backend Operating System` must disappear in favour of the canonical `Self-Healing Backend Operations System` wherever canonical Project content is intended.

Preserve presentation including:

- featured/supporting shells;
- Pay4Me composition;
- PortfolioAssistantPreview;
- EmailWorkflowPreview;
- VoiceVisual;
- RecoveryVisual;
- overlapping desktop composition;
- mobile stacked composition;
- connectors;
- display-only project icons; and
- gradients/tone treatment.

Preserve approved static content including:

- `More projects and experiments are always in progress.`;
- `Let’s build something together` → `#work-cta`;
- `Different projects. One consistent focus`;
- project display labels/icons inside the connection visual as presentation selection; and
- the approved current Shifty/Self-Healing one-line card descriptions where Notion explicitly keeps them frontend-only.

## About `/about`

Consume `AboutService.getPageData()`.

Database-backed content must include:

- Hero content;
- Profile portrait;
- Customer/User child block and icons;
- System/Workflow child block and icons;
- Profile principles;
- How I Got Here content;
- four ordered Experiences: Pay4Me, The Hippodrome Casino, Beyond the interface, Today;
- thinking content and `Profile.thinkingPrinciples`;
- process content and `Profile.processPrinciples`;
- Current Exploration content/icons;
- `Profile.controlPrinciples`;
- Outside Engineering MediaBlocks;
- final CTA/actions; and
- Profile name/title/positioning.

Preserve presentation including portrait effects, rails/connectors, journey/timeline treatment, process numbers/visuals, exploration visual, InterestCard and signature treatment.

Preserve approved static/frontend-only content including:

- `Product → Operations → Systems → Current focus`;
- `Customer action → Clear handoff → Reliable response`;
- `Learn from production`; and
- `Roles · Projects · Collaborations · Speaking · Other enquiries`.

Do not reinterpret `Beyond the interface` or `Today` as ContentBlocks. They remain Experiences.

## Audit `/audit`

Consume `AuditService.getPageData()`.

Database-backed content must include:

- Hero and audit ActionBlock;
- Why This Audit Exists content;
- six symptom IconBlocks;
- complete Before & After hierarchy including nested customer/workflow groups;
- Proof ContentBlock;
- canonical Pay4Me / WithRadius, Portfolio Assistant and Email PA Projects;
- `Project.visualText`;
- `Project.visualBlock`; and
- final CTA/action.

Preserve presentation including Before/After connectors, Audit card/tone treatments, `Pay4MeVisual`, `PortfolioAssistantVisual`, `EmailWorkflowVisual`, SignalVisual, loading skeleton and branching SVG.

Preserve approved static/frontend-only content including:

- `Takes 2 - 3 minutes`;
- `Customer journey ↔ Underlying disconnect ↔ Operational workflow`;
- `The audit helps identify where the friction lives before deciding what should change.`; and
- `Free. No obligation. Your information is never shared.`

Checkpoint: all four live routes render canonical backend data, retain the approved visual design/static exceptions, and no current custom visual is replaced with a generic CMS renderer.

---

# Phase 3 — Public Cache Components and dependency tagging

## Cached page reads

Create cached public read functions equivalent to:

- `getCachedHomePageData()`
- `getCachedWorkPageData()`
- `getCachedAboutPageData()`
- `getCachedAuditPageData()`

Follow repository naming conventions if a different exact location/name is clearer. Cache the composed public page read rather than scattering cache wrappers around individual Prisma calls without need.

Normal visitor target:

```text
normal visitor
→ cache hit
→ static-like fast public rendering

invalidated/missing
→ page service
→ repositories
→ Prisma
```

## Central cache-tag strategy

Create one deterministic cache-tag builder/naming module. Do not scatter raw cache strings throughout Server Actions/components.

The tag system must support dependencies equivalent to:

```text
portfolio:page:home
portfolio:page:work
portfolio:page:about
portfolio:page:audit

portfolio:profile

portfolio:projects
portfolio:project:{slug}

portfolio:experiences
portfolio:experience:{id}

portfolio:content-block:{id}
portfolio:icon-block:{id}
portfolio:media-block:{id}
portfolio:action-block:{id}
```

Exact final names may follow repository conventions, but they must be centralized, deterministic and testable.

## Dependency registration

Each cached page read must register:

1. its page-level tag; and
2. shared entity/collection tags for data returned by the page service.

Where practical, derive entity dependency tags from the composed result instead of manually encoding every consuming route into each mutation.

Required behaviour example:

```text
cached Home → project:pay4me dependency
cached Work → project:pay4me dependency
cached Audit → project:pay4me dependency

Pay4Me update
→ invalidate project:pay4me
→ all three consumers refresh
```

Do equivalent dependency tracking for Profile, Experiences, shared IconBlocks, MediaBlocks, ActionBlocks and ContentBlocks. Use collection tags where membership/reordering changes matter, e.g. Work's all-Projects composition.

## Mutation invalidation semantics

For successful Server Action writes:

```text
validated write
→ transaction succeeds
→ updateTag(...)
→ next affected read obtains fresh data
```

For Route Handler mutations where `updateTag()` is not the correct API, use current supported `revalidateTag()` semantics.

Use `revalidatePath()` only when a path-specific concern genuinely needs it.

Admin/auth pages must not share public static caching/session responses.

## Build-time/cache verification

Verify and document:

- whether `next build` executes the database-backed cached public reads;
- what database/environment availability is required during build;
- how the cache behaves after deployment;
- what happens after `updateTag()`;
- what happens after `revalidateTag()`; and
- whether the next read blocks for fresh data or uses stale-while-revalidate according to the chosen supported API.

Checkpoint: public rendering is static-like/cached, no normal uncached Prisma query occurs on every visitor request, and tag dependency tests prove targeted invalidation.

---

# Phase 4 — Supabase Auth and write application layer

## Supabase Auth infrastructure

Add the current maintained Supabase SSR integration appropriate to the installed Next.js version. `@supabase/ssr` is the expected dependency if still absent. Reuse the existing `@supabase/supabase-js` installation.

Keep clear separation between:

- browser auth client where required;
- server auth client/session handling;
- Milestone 15 server-only Storage administration/service-role client.

Never expose `SUPABASE_SERVICE_ROLE_KEY` or service-role clients to browser code.

## Authentication flow

Preferred route structure, adjusted only for repository conventions:

```text
/admin/login
/auth/confirm
/admin/**
```

Flow:

```text
Freeman enters email
→ request magic link
→ Supabase Auth
→ email confirmation link
→ application confirmation endpoint
→ verified cookie-backed session
→ /admin
```

Requirements:

- passwordless/magic-link only;
- no public registration UI;
- use the equivalent of `shouldCreateUser: false` for login requests;
- production Auth user for `freemanmadudili@gmail.com` is deliberately pre-provisioned as a human setup task;
- local and production provisioning/redirect configuration is documented.

## Central authorization

Create one server-only authorization helper equivalent to:

```text
requireAdmin()
```

It must:

1. verify the authenticated Supabase identity using the current recommended server-side identity mechanism;
2. obtain/normalize the verified email; and
3. allow access only when it equals the configured approved admin email.

Prefer a central server-only configuration value such as:

```text
ADMIN_EMAIL=freemanmadudili@gmail.com
```

Do not make authorization a browser-only check.

Enforce authorization at:

- protected `/admin` layout/page boundary;
- every admin Server Action;
- every protected media mutation Route Handler; and
- any other write endpoint introduced by this milestone.

Explicit safety requirements:

- unknown email cannot create an Auth account through the admin login;
- an authenticated non-approved account cannot access `/admin`;
- an authenticated non-approved account cannot call write functions directly;
- unauthenticated direct mutation requests are rejected.

## Proxy/routing

Update the existing explicit request allowlist safely to support required admin/auth paths and current Supabase session-refresh behaviour.

Add only required route families such as `/admin/**` and `/auth/**`; preserve current public/API/static/generated behaviour. Do not turn the current allowlist into an accidental broad catch-all.

Admin/auth responses are dynamic/private and must not be accidentally cached in the public portfolio cache.

## Write application layer

Milestone 15 intentionally created read-oriented repositories. Extend the portfolio capability with only the writes needed by the admin.

Required request flow:

```text
Admin form
→ Server Action
→ requireAdmin()
→ Zod validation
→ portfolio write/application service
→ repository
→ Prisma transaction where needed
→ successful cache invalidation
```

UI components and Server Actions must not call Prisma directly.

Follow the repository's service/repository architecture. Split services by cohesive responsibility, not by each operation and not into a single unrelated god-service. Use the minimum coherent write-service surface required by the actual domain.

Potential responsibilities may include Profile/content/project/experience/media administration, but exact class boundaries must be validated against `.agents/skills/nextjs-architecture/SKILL.md` and the final module state.

## Required repository write capability

Add only methods required by the actual admin UX.

### Profile

Support:

- updating singleton fields;
- updating/reordering Profile IconBlock collections.

Never create/delete the singleton through admin.

### ContentBlock

Support approved structure editing such as:

- content fields;
- known root order where renderer supports it;
- child relationship order;
- IconBlock/MediaBlock/ActionBlock relationships.

Arbitrary unknown section creation is not required.

### IconBlock

Support create/update where required by approved relationships and safe delete only when unreferenced/explicitly handled.

### ActionBlock

Support base IconBlock semantics plus variant, URL, assistantMessage, relationship handling and safe deletion.

### MediaBlock

Support base IconBlock semantics, metadata, owning relationships and safe deletion/replacement lifecycle.

### Project

Support approved fields:

- create;
- update;
- safe delete;
- slug;
- title;
- category;
- problem;
- solution;
- outcome;
- cover;
- external links;
- featured;
- order;
- markdown;
- visualText;
- visualBlock.

### Experience

Support create/update/safe delete, order, dates/fields and ordered IconBlocks.

Use transactions for multi-record relation/order changes.

## Deletion safety

Do not expose generic destructive deletes that can silently break configured page reads.

Protect at minimum:

- Profile from deletion;
- required known page sections from casual deletion;
- canonical Projects required by explicit Home/Audit selectors from deletion unless application selection is deliberately changed through a future approved change;
- shared IconBlocks/MediaBlocks/ActionBlocks while referenced.

Home and Audit deliberately select canonical Projects independently by known slugs. Creating a new Project does not automatically insert it into Home/Audit. Do not introduce `ContentBlock → Project` for admin convenience.

Return clear admin errors instead of corrupting the public composition contract.

## Zod mutation validation

Use Zod at actual untrusted mutation boundaries. Validate fields relevant to each action, including:

- string lengths/requiredness;
- URLs;
- assistant messages;
- Lucide icon names;
- allowed colour values;
- media types;
- Project slug rules;
- `Project.visualBlock` registry values;
- external links;
- ordering payloads;
- IDs; and
- upload metadata.

Do not duplicate every trusted Prisma output as a Zod schema.

Checkpoint: passwordless authentication and server-side Freeman-only authorization work, all write entrypoints are authorized/validated, portfolio repositories own persistence, and successful writes trigger targeted invalidation.

---

# Phase 5 — Portfolio-specific admin UI

Build a clean domain-specific admin using existing shadcn/ui conventions.

Preferred information architecture:

```text
/admin

Dashboard

Pages
├── Home
├── Work
├── About
└── Audit

Projects
Experiences
Media
Profile

Advanced / Reusable Content
├── IconBlocks
├── ActionBlocks
└── MediaBlocks where useful
```

Adjust exact navigation only where the final model makes another organisation materially clearer.

## Dashboard

Keep it simple. Provide clear entry points to Home, Work, About, Audit, Projects, Experiences, Profile and Media. Basic counts/status are optional. Do not build analytics.

## Page editors

Render semantic known sections rather than raw database rows.

Example:

```text
Home

Hero
  Eyebrow
  Title
  Copy
  Actions

What I Help Improve
  Customer Journeys
  Operational Workflows

Relevant Work
Free Audit
Final CTA
```

Use the same known-section/presentation identity logic established in Phase 1 so the admin communicates human-readable context.

For ContentBlock identity URLs used by the renderer registry, either make them read-only in normal editing or validate against the known allowed identifiers. Do not let routine editing silently disconnect a section from its renderer.

## Profile editor

Support:

- name;
- title;
- positioning;
- email;
- LinkedIn URL;
- GitHub URL;
- coverImage management;
- audience;
- principles;
- thinking principles;
- process principles;
- control principles;
- outcomes.

Preserve singleton semantics.

## Project editor

Support all approved Project fields. Keep `visualText` distinct from `solution`.

`visualBlock` must be a selector derived from the registered visual-component registry, not arbitrary free text. Allow null where the domain permits no registered visual.

## Experience editor

Support title, tag, copy, insight, role, start/end date, order and ordered IconBlocks.

## ContentBlock editor

Support eyebrow, title, copy, safe URL/identity handling, supported order, approved child ContentBlocks, IconBlock relations, MediaBlock relations and ActionBlock relations.

Do not enable arbitrary page-section component creation.

## ActionBlock editor

Support base IconBlock fields where applicable plus variant, URL and assistantMessage. Make it clear whether an action navigates, triggers the assistant, or uses an approved combination. Decorative button arrows/icons remain presentation.

## Lucide icon picker

Build one reusable searchable picker with:

- canonical Lucide-name search;
- visual preview;
- valid-name-only persistence;
- shared validation rules with the public icon resolver; and
- reasonable bundle/performance behaviour.

No components/JSX are stored.

## Icon colour picker

Do not add arbitrary free-form hex editing in the first admin.

Inspect existing site design tokens and currently approved/seeded semantic colour usage. Create one central allowed palette from existing approved design semantics. If no additional content colour is justified, support default/no colour plus only existing semantic options.

Do not invent a new palette in this milestone. Document the final allowed values in `docs/portfolio-content-system.md`.

## Relationship ordering

Support deterministic ordering for:

- known root ContentBlocks where supported;
- child ContentBlocks;
- ContentBlock IconBlocks;
- ContentBlock MediaBlocks;
- ContentBlock ActionBlocks;
- Profile collections;
- Experience IconBlocks;
- Project/Experience domain order.

A reliable first implementation may use Move Up / Move Down / explicit controls. Drag-and-drop is optional and must not add a heavy dependency without a material UX benefit.

Ordering writes must be transactional where multiple rows/constraints are involved.

## Reusable record UX

Because reusable blocks may have multiple references, avoid surprising global changes.

Where practical show sharing/reference context or reference counts and warn before editing a shared record. At minimum, prevent deletion while referenced. Do not duplicate shared records merely to avoid handling reuse.

## Markdown

If `Project.markdown` is exposed, provide a practical Markdown text field. Do not build a WYSIWYG CMS. Preview is optional if simple. Rendering must follow existing safe frontend conventions.

Checkpoint: Freeman can navigate semantic editors for all approved content areas, make supported edits/reorders safely, and cannot create arbitrary presentation components or submit invalid icons/visualBlock values.

---

# Phase 6 — Media mutation lifecycle

Extend the Milestone 15 Supabase Storage abstraction rather than replacing it.

The expected bucket remains:

```text
portfolio-media
```

Use the final merged M15 implementation as truth.

## Upload boundary

Normal text/content mutations use Server Actions. Binary media upload should use the cleanest protected boundary, expected to be a protected Route Handler unless final framework/repository evidence supports another better boundary.

Requirements:

- `requireAdmin()`;
- MIME validation;
- file-size validation;
- allowed media-type validation;
- safe object naming;
- server-only credentials;
- normalized errors;
- no browser service-role client.

## Replacement path strategy

Prefer versioned/new object paths for replacements rather than repeatedly overwriting one stable object path, so CDN/browser stale objects and collisions are minimized.

Conceptual examples only:

```text
images/profile/{version-or-uuid}.webp
media/{version-or-uuid}.{ext}
```

Choose actual path conventions based on final M15 storage design and the media's owning domain.

## Compensating replacement flow

PostgreSQL and Object Storage do not share one transaction. Use compensating safety:

```text
validate
→ upload new object
→ update owning database record
→ invalidate relevant cache
→ delete old unreferenced object
```

If DB update fails after upload, remove the newly uploaded orphan where safe.

If deleting the old object fails after a successful DB update, keep the working new DB reference, log/report cleanup failure and do not revert to broken media.

Never delete the old object before the owning database reference safely points to the replacement.

## Supported media ownership

### Profile.coverImage

Support portrait preview/upload/replace.

### MediaBlock.source

Support upload/replace of approved managed images/videos plus alt text.

### Project.cover

Where a Project has/uses a cover MediaBlock, allow appropriate select/upload/replace handling. Do not invent covers for Projects that do not have them. Existing repo-public Project covers may remain valid until deliberately replaced.

### Outside Engineering

Ensure the About admin can manage existing MediaBlocks:

- Strength
- Endurance
- Community
- Always Learning

Support preview, replacement, alt text and existing icon/label semantics.

### CV

Inspect and preserve the final Milestone 15 CV treatment. Do not create a Prisma document/CV model solely for this milestone.

If M15 retains the CV as a fixed Supabase Storage-backed site asset, preserve it. A simple protected replace operation is optional only if it fits cleanly without schema expansion. The durable guide must at minimum explain how the CV is managed/replaced.

## MediaField

Provide reusable admin media UI with:

- current preview;
- upload;
- replace;
- remove where allowed;
- alt text where owned by the domain;
- progress/error state.

A lightweight `/admin/media` view may expose managed MediaBlock records/shared assets. Do not build a generic Storage filesystem browser.

## Media invalidation

After DB ownership/source changes succeed, invalidate owning Profile/MediaBlock/Project tags so dependent public pages refresh. New/versioned object URLs should minimize stale browser/CDN behaviour.

Checkpoint: authorised media replacements are validated, failure compensation is safe, public consumers update without redeployment, and unauthorised upload/delete attempts are rejected.

---

# Phase 7 — End-to-end verification and durable handoff

## Required automated coverage

Follow repository testing conventions and test public behaviour/boundaries rather than private file layout.

At minimum add focused coverage for:

### Presentation adapters

- correct known section resolution;
- nested block mapping;
- no array-index identity assumptions;
- missing/unknown section handling.

### Icon resolver

- known valid icon;
- invalid/unknown fallback.

### Project visual registry

- known visual identifier;
- unknown visual fallback;
- admin selector accepts only registered values.

### Public integration

- all four page adapters receive and render canonical dynamic data;
- intentionally static Notion exceptions remain present/static;
- current custom visuals remain code-owned.

### Actions

- URL navigation semantics;
- assistantMessage trigger through existing assistant contract;
- variant adaptation.

### Cache tags

- deterministic names;
- correct dependency registration;
- a shared Project invalidates all consuming page caches;
- a page-only ContentBlock does not broadly invalidate unrelated pages;
- collection-membership/reordering tags work.

### Write services/repositories

- validation;
- transactional ordering/relation updates;
- reusable relation behaviour;
- deletion guards;
- canonical Project protections.

### Authorization

- unauthenticated access rejected;
- authenticated non-admin rejected;
- approved Freeman admin accepted;
- direct write action without authorization rejected;
- media write without authorization rejected.

### Magic link

Automate what can be reliably tested within repository/Supabase constraints. Keep credential/email-delivery verification manual when appropriate.

### Media

- invalid MIME rejected;
- oversized input rejected;
- successful upload path;
- DB update;
- versioned replacement;
- cleanup after DB failure;
- safe old-object cleanup behaviour;
- unauthorised upload rejected.

### Public/admin cache separation

Verify session/admin-specific responses are not served from public content cache.

## Repository quality commands

Use the scripts that exist after implementation. At minimum run equivalents of:

```text
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run build
```

Also run focused portfolio/auth/media/database tests introduced by this milestone where they are not covered by the aggregate script.

Do not redesign deferred indexing merely to change tests. Keep normal build/runtime compatibility only.

---

# Targeted mutation → public update examples

These are required architecture behaviours, not optional examples.

## Pay4Me

```text
Admin edits Pay4Me
→ authorised/validated Project write
→ ProjectRepository
→ Prisma succeeds
→ invalidate project dependency tag
→ cached Home + Work + Audit consumers become invalid
→ next relevant public read returns updated canonical Project data
```

Mutation code should not need a hardcoded list of every page that uses Pay4Me when dependency tags already encode consumers.

## Profile

```text
Admin edits Profile
→ authorised Profile write
→ invalidate profile dependency tag
→ Home + Work + About refresh as required
```

## Home-only ContentBlock

```text
Admin edits Home Hero
→ authorised ContentBlock write
→ invalidate its entity/page dependency
→ Homepage refreshes
→ unrelated Work/Audit cache remains untouched
```

## Shared IconBlock

```text
Admin edits shared IconBlock
→ authorised IconBlock write
→ invalidate icon dependency tag
→ all cached consumers that registered that icon refresh
```

Targeted behaviour is an acceptance requirement.

---

# Public cache vs admin/auth boundary

Public portfolio routes:

- cached/static-like;
- database-backed;
- dependency-tag invalidated.

Admin/auth routes:

- authenticated/private;
- dynamic where session state requires it;
- no accidental public cache reuse;
- no cached Supabase session-specific response or cookie mutation.

Keep these concerns separate.

---

# Domain safety boundaries

These remain invariant throughout Milestone 16:

- no `ContentBlock → Project` relationship;
- no `FlowBlock`;
- no Prisma `Admin` model or custom auth-user table;
- no arbitrary page builder;
- no executable code/JSX stored in Project.visualBlock;
- no generic CMS component creation from unknown database values;
- no unsafe deletion of referenced reusable blocks;
- no silent deletion of canonical Projects required by page-service selectors;
- no page-specific duplicate Profile records;
- no change to Experience interpretation established by About Mapping;
- no index/embedding regeneration on admin writes.

Projects and Experiences may be created where the approved domain supports collections, but page-specific Home/Audit Project selections remain application-defined. Creating a Project does not automatically add it to those curated consumers.

---

# Production and deployment considerations

The implementation and durable guide must document required production configuration, including:

- Supabase Auth Site URL;
- allowed redirect URLs for the production site and required local development URLs;
- server-only approved admin email configuration;
- deliberate pre-provisioning of `freemanmadudili@gmail.com` in Supabase Auth;
- public/browser Supabase environment variables;
- server-only Storage service-role credentials;
- public `portfolio-media` bucket assumptions;
- database/runtime environment required by public cached reads;
- Cache Components configuration and invalidation behaviour;
- media size/type/path rules.

Do not automatically perform production Auth/storage/config changes unless repository workflow permits and Freeman explicitly requests the production operation.

Human-only production setup belongs under Manual tasks and must be surfaced in `ready_for_human`.

---

# Durable human-readable system guide

Milestone 16 must create:

```text
docs/portfolio-content-system.md
```

unless final repository guidance makes a different durable docs path mandatory.

This Markdown file is the canonical phone-readable architecture/operations handoff for the completed Milestone 15 + 16 content system. Link it from the root README if consistent with current documentation conventions.

It must be concise enough to read comfortably and contain:

# Portfolio Content System

## 1. What Milestone 15 Built

Brief domain/database, migration, seed/bootstrap, repositories, page services, Supabase Storage and legacy cleanup.

## 2. What Milestone 16 Built

Frontend integration, caching, admin/auth, write layer, media management and revalidation.

## 3. Architecture Overview

Readable diagrams such as:

```text
Public page
→ cached page data
→ page service
→ repositories
→ Prisma
→ PostgreSQL
```

and:

```text
Admin
→ Server Action / protected media boundary
→ auth + authorization
→ validation
→ write service
→ repository/storage provider
→ database/storage
→ cache invalidation
```

## 4. Important Folders / Files

Only important entry points.

## 5. Domain Model Summary

Short reference and key invariants.

## 6. Public Rendering & Cache Flow

Explain when DB reads occur and what is static-like/cached.

## 7. Cache Tags / Revalidation

Explain dependency tags and targeted invalidation.

## 8. Admin

URL, information architecture, editable content and deliberate limits.

## 9. Authentication

Magic-link flow, Freeman-only authorization and required config.

## 10. Supabase Storage

Bucket, media paths and replacement/delete compensation.

## 11. Local Development

Exact current commands/environment assumptions.

## 12. Database / Initial Bootstrap

Reference the Milestone 15 migration/bootstrap workflow.

## 13. Production Setup

Exact human-only steps.

## 14. Manual Verification Checklist

Compact end-to-end checklist.

## 15. Known Limitations

Only real limitations.

## 16. Deferred Work

Explicitly include indexing redesign, embedding regeneration and assistant knowledge migration/reindex.

Do not require Google Docs as the source of truth.

---

# Manual tasks

The following steps require human credentials/external systems or human visual judgement and remain unchecked in this contract.

- [ ] Confirm Milestone 15 workflow state is archived/reconciled before activating/running Milestone 16.
- [ ] Provision the approved Supabase Auth user `freemanmadudili@gmail.com` in local/production environments as documented.
- [ ] Configure production Supabase Auth Site URL and redirect URLs.
- [ ] Configure production `ADMIN_EMAIL` and required Supabase public/server environment variables.
- [ ] Perform the documented production configuration/deployment steps that require private access.
- [ ] Perform the full end-to-end admin/public visual verification below on the intended environment.

## Manual end-to-end flow

### Login

1. Start the application.
2. Open `/admin`.
3. Sign in with `freemanmadudili@gmail.com` using a magic link.
4. Reach the protected admin.
5. Confirm another/unknown email cannot register or gain admin access.

### Homepage

1. Edit Home Hero text.
2. Save.
3. Open the public Homepage.
4. Confirm the change appears without redeploying and the intended visual composition is unchanged.

### Shared Project

1. Edit a safe Pay4Me field such as category/problem/solution/visualText.
2. Save.
3. Verify Home, Work and Audit consumers show the updated canonical Project content where they use that field.

### Profile

1. Edit Profile positioning/content.
2. Save.
3. Verify affected public pages update without unrelated page breakage.

### Ordering

1. Change one supported reusable-block/relationship order.
2. Save.
3. Verify rendered order changes as expected.

### Media

1. Replace the profile portrait.
2. Save.
3. Verify dependent public pages render the new image.
4. Verify documented old-object cleanup behaviour.

### Project visual

1. Select a valid registered `visualBlock` where applicable.
2. Save.
3. Verify Audit renders the registered visual.
4. Confirm arbitrary invalid visual identifiers cannot be submitted.

### Assistant CTA

Verify URL ActionBlocks navigate correctly and `assistantMessage` ActionBlocks still trigger the existing assistant with the expected initial message.

---

# Manual acceptance criteria

- [ ] Freeman can sign in to `/admin` with the approved email using the documented passwordless flow.
- [ ] An unknown email cannot create/access the portfolio admin through the login flow.
- [ ] The four public pages retain their intended current visual design and approved static content after database integration.
- [ ] A Homepage edit becomes visible publicly without redeployment.
- [ ] A shared Project edit appears across relevant Home/Work/Audit consumers.
- [ ] Profile edits update all relevant public consumers.
- [ ] Supported ordering changes render correctly.
- [ ] Profile portrait replacement works and old-object cleanup behaves as documented.
- [ ] Registered Project visual selection renders correctly and arbitrary values are rejected.
- [ ] Existing assistant-trigger CTAs still behave correctly.
- [ ] `docs/portfolio-content-system.md` is readable/accurate enough to operate the finished content system without reconstructing it from commits.

---

# Explicitly out of scope

Milestone 16 does not include:

- indexing architecture redesign;
- embedding regeneration;
- full new-domain content reindex;
- assistant retrieval migration;
- AssistantService redesign;
- SourceRecord/chunking/search-threshold redesign;
- SiteChunk/SearchIndexJob redesign;
- meeting/calendar changes;
- automatic embedding work after admin writes;
- arbitrary CMS/page-builder functionality;
- arbitrary React-component editing;
- public account registration;
- multiple admin roles;
- team/user management;
- analytics dashboard;
- content scheduling/publishing workflow;
- draft/version-history system;
- arbitrary theme editor;
- free-form CSS editor;
- rich WYSIWYG CMS platform;
- unnecessary Prisma schema redesign.

For this milestone:

```text
Admin update
→ public page cache invalidation
```

not:

```text
Admin update
→ embedding regeneration
```

The later assistant/indexing milestone owns new-domain indexing and retrieval awareness.

---

# Expected implementation areas

Use actual final repository paths rather than creating files mechanically. Expected areas include:

- `src/app/page.tsx`
- `src/app/work/**`
- `src/app/about/**`
- `src/app/audit/**`
- current Home/Work/About/Audit section components
- `src/features/portfolio/**`
- `src/features/audit/**`
- a new admin frontend feature where required
- `src/app/admin/**`
- `src/app/auth/**`
- `src/proxy.ts`
- Next.js configuration
- portfolio repository interfaces/implementations
- portfolio write/admin services/models/schemas as required
- `src/server/composition-root.ts` or an architecture-compliant split composition area if genuinely needed
- Supabase auth server/browser infrastructure
- existing Supabase Storage provider extension
- cache/tag infrastructure
- page presentation adapters
- Lucide icon resolver/registry
- Project visual registry
- runtime mutation contracts/schemas
- tests
- README documentation link
- `docs/portfolio-content-system.md`

Do not create every listed file/folder merely because it appears here. Each new file must own a real responsibility under the repository architecture skill.

---

# Agent-verifiable acceptance criteria

Checklist boxes remain unchecked in the contract. The independent milestone review records PASS/FAIL/NOT VERIFIED.

## Dependency/preflight

- [ ] Milestone 16 implementation began from the final merged default branch after Milestone 15 was confirmed merged and workflow-state reconciliation was complete.
- [ ] Final merged Milestone 15 repository/service/page-data/storage interfaces were re-inspected before implementation.
- [ ] The installed Next.js version and matching official/bundled framework docs were used for cache, Server Action, Proxy and revalidation choices.
- [ ] No unapproved Prisma domain redesign was introduced.

## Public frontend

- [ ] `/`, `/work`, `/about` and `/audit` consume the Milestone 15 portfolio service/data layer.
- [ ] Dynamic content identified by the approved Mappings/Seed Data is no longer sourced from duplicated hardcoded/local canonical strings.
- [ ] Intentionally static mapped content remains frontend-owned.
- [ ] Current custom visual/layout components remain React presentation code.
- [ ] Canonical Project, Experience and Profile values render from domain data where approved.
- [ ] No fragile `contentBlocks[index]` section-identity pattern is used as the page architecture.
- [ ] Known section resolution fails safely for unsupported data.
- [ ] ActionBlocks support approved URL and assistantMessage behaviours through one consistent adapter.
- [ ] Existing assistant-trigger semantics are reused rather than duplicated.
- [ ] The stale `Self-Healing Backend Operating System` dynamic duplication is eliminated where canonical Project data applies.

## Registries

- [ ] One safe Lucide name resolution/validation source is shared by public rendering and admin input.
- [ ] Invalid icon names fail safely and cannot be persisted through normal admin forms.
- [ ] One closed Project visual registry maps approved `visualBlock` identifiers to known components.
- [ ] Unknown visualBlock values fail safely and are not executable/dynamically imported as arbitrary code.
- [ ] Page-specific Project previews remain available where mappings intentionally use a different visual from `Project.visualBlock`.

## Rendering/caching

- [ ] Public page reads use the verified Next.js 16 Cache Components model.
- [ ] Normal cached public page requests do not perform unnecessary uncached Prisma reads per visitor.
- [ ] Cache-tag naming/building is centralized and deterministic.
- [ ] Cached pages register page plus entity/collection dependency tags relevant to their composed result.
- [ ] Shared Project invalidation refreshes all relevant page consumers without mutation code hardcoding each consuming route.
- [ ] Profile dependency invalidation refreshes relevant Home/Work/About consumers.
- [ ] Page-only ContentBlock invalidation does not unnecessarily invalidate unrelated pages.
- [ ] Collection membership/reordering has a collection-level invalidation path where required.
- [ ] Admin mutation makes changed public content visible without redeployment.
- [ ] Admin/auth/session responses are not stored in the public content cache.
- [ ] Build-time database/cache behaviour is verified and documented rather than assumed.

## Auth and authorization

- [ ] `/admin` exists behind Supabase Auth.
- [ ] Passwordless/magic-link login is implemented with public user creation disabled in the admin login flow.
- [ ] No Prisma Admin/custom auth-user model is introduced.
- [ ] A central server-side Freeman-only authorization helper verifies authenticated identity and configured allowed email.
- [ ] Protected layout/pages enforce authorization server-side.
- [ ] Every admin Server Action enforces authorization independently.
- [ ] Every protected media Route Handler enforces authorization independently.
- [ ] Unauthenticated write calls fail.
- [ ] Authenticated non-approved write calls fail.
- [ ] The existing route allowlist remains explicit while allowing required admin/auth paths.

## Write architecture

- [ ] UI components/Server Actions do not call Prisma directly.
- [ ] Portfolio persistence remains repository-owned.
- [ ] Write services/use cases are cohesive and architecture-compliant.
- [ ] Zod validates untrusted mutation payloads at real trust boundaries.
- [ ] Multi-record relation/order operations are transactional where required.
- [ ] Profile cannot be deleted.
- [ ] Required known page structures cannot be casually deleted into a broken renderer state.
- [ ] Referenced reusable blocks cannot be deleted unsafely.
- [ ] Canonical Projects required by explicit Home/Audit selectors cannot be deleted in a way that silently breaks page services.
- [ ] No `ContentBlock → Project` relationship is introduced.
- [ ] No FlowBlock is introduced.

## Admin UX

- [ ] Dashboard and semantic page editors exist for Home, Work, About and Audit.
- [ ] Profile editor works for approved Profile fields/collections.
- [ ] Project editor works for approved Project fields including distinct `visualText` and `visualBlock`.
- [ ] Experience editor works for approved Experience fields and ordered IconBlocks.
- [ ] Approved ContentBlock/ActionBlock/reusable content can be edited without exposing a generic page builder.
- [ ] ContentBlock renderer-identity URLs are protected from arbitrary edits that would silently break known-section mapping.
- [ ] Searchable Lucide picker persists only valid canonical names.
- [ ] Colour picker uses only the documented existing allowed semantic palette/default.
- [ ] Project visual selector derives from the closed visual registry and allows null where valid.
- [ ] Relationship ordering controls are deterministic and persisted correctly.
- [ ] Shared-record deletion is prevented while referenced and reuse is communicated clearly enough to avoid accidental global destruction.

## Media

- [ ] Profile portrait replacement works through authenticated server-side media infrastructure.
- [ ] Managed MediaBlock upload/replacement works with validated MIME/type/size.
- [ ] Alt text can be edited where owned by MediaBlock.
- [ ] Project-cover handling works for Projects that already support/receive a cover without inventing required covers for null-cover Projects.
- [ ] Strength, Endurance, Community and Always Learning media can be managed through the About/admin flow.
- [ ] Replacement uses a safe new/versioned path strategy rather than depending on repeated same-path overwrite caching.
- [ ] New-object cleanup occurs when the DB update fails where safe.
- [ ] Old-object cleanup occurs only after the DB points at the new object and failure does not break the working new reference.
- [ ] Unauthorized media mutation is rejected.
- [ ] Media writes invalidate owning domain dependencies so public consumers update without redeployment.
- [ ] CV behaviour from Milestone 15 remains documented/preserved without inventing a new domain model.

## Documentation

- [ ] `docs/portfolio-content-system.md` exists and accurately describes Milestones 15 + 16.
- [ ] The guide documents important architecture/folders, domain summary, public rendering/cache flow, tag invalidation, admin URL/scope, auth flow, Storage/media flow, local commands, initial bootstrap, production setup, manual verification, real limitations and deferred indexing.
- [ ] Current commands/environment requirements match the repository after implementation.
- [ ] The root README links the guide if consistent with repository documentation conventions.
- [ ] Deferred indexing/embedding/assistant retrieval work is explicit.

## Quality/regression

- [ ] Repository-standard validation passes on the implementation head.
- [ ] Production build passes.
- [ ] Relevant unit/integration/database tests pass.
- [ ] Existing meeting/calendar and assistant runtime paths are not intentionally redesigned or regressed by this milestone.
- [ ] Existing search/index retrieval remains build/runtime compatible within Milestone 15's deferred boundary.
- [ ] No unrelated feature or domain was changed merely to broaden the milestone.

---

# Completion / `ready_for_human` report

In addition to the repository's normal workflow result, the final human handoff must provide a concise phone-readable summary containing:

- pull request number/link;
- reviewed head SHA;
- what Milestone 16 changed;
- admin URL;
- exact login flow;
- key local commands;
- required environment/production setup still pending;
- exact manual tests Freeman should perform;
- `docs/portfolio-content-system.md` path/link;
- real known limitations; and
- explicitly deferred indexing/embedding/assistant work.

Do not require Freeman to reconstruct the verification plan from commit messages or review comments.
