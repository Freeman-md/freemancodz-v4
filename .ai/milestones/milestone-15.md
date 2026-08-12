# Milestone 15: Portfolio Content Backend Rebuild

**Status:** Frozen
**Version:** 1.0.0  
**Last Updated:** 2026-08-12  
**Depends On:** Milestone 14  
**Target Pull Request:** —  
**Target Branch:** `feat/milestone-15-portfolio-content-backend`  
**Superseded By:** —

## Goal

Replace the obsolete portfolio/content backend with the approved domain model, a safe forward-only PostgreSQL migration, canonical initial seed/bootstrap data, domain repositories, page-oriented read services and Supabase Object Storage-backed portfolio media, while preserving unrelated database/application behaviour and leaving the live `/`, `/work`, `/about` and `/audit` page presentation/content implementation unchanged.

At completion, the backend foundation required by the next frontend-conversion milestone must exist and be tested, while the indexing/embedding/retrieval subsystem remains deliberately deferred except for the minimum compatibility work required to keep the repository generating, compiling, building and serving existing retrieval safely.

---

## Source of truth

Read these sources before implementation and treat them in this precedence order for portfolio content/domain decisions:

1. `AGENTS.md`
2. `.agents/skills/nextjs-architecture/SKILL.md`
3. this milestone contract
4. the nine approved Notion artifacts under `FreemancodzV4`
5. current repository evidence and the repository inventory that preceded this milestone

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

The Page Mappings define allocation/composition. The four Seed Data documents define initial values, canonical Project/Experience/Profile values, ordering, media references and ActionBlock assistant messages.

Do not recover seed values from stale repository content when an approved Notion Seed Data value exists.

The readable documentation keys such as `home.hero`, `project.pay4me-withradius` and `profile.audience.founders` are seed/documentation references only unless an approved domain field explicitly exists. Do not add a persisted generic `key` field merely because the seed documentation uses readable keys.

If the implementation agent cannot read one of the nine Notion artifacts, stop and report the missing source rather than guessing from `content/portfolio/**`, archived routes or old seed files.

---

## Existing repository baseline

The implementation begins from these verified conditions:

- the current live `/`, `/work`, `/about` and `/audit` routes are component-driven and primarily render hardcoded JSX/local arrays rather than current portfolio Prisma page data;
- the old database-backed portfolio stack still contains legacy `ContentBlock`, `Principle`, `Service`, `Experience` and `Project` persistence plus legacy content schemas/mappers/services;
- `content/portfolio/**` and `content:sync*` form the obsolete file-to-database authoring workflow;
- archived `/home-old`, `/work-old` and `/about-old` routes keep stale page-composition code alive;
- the current Vercel Blob path is used for the profile portrait, Outside Engineering images and CV and is no longer a reliable dependency;
- Prisma connects to PostgreSQL through the existing `DATABASE_URL` / `PrismaPg` infrastructure;
- `Meeting`, `SiteChunk` and `SearchIndexJob` are unrelated/deferred models that must survive this portfolio rebuild;
- current search-index source code directly imports/queries the old portfolio Prisma models and legacy content schemas;
- existing indexed `SiteChunk` data currently powers the assistant retrieval path;
- Supabase local configuration exists, but application Supabase Object Storage infrastructure is not yet implemented;
- `@vercel/blob` is currently installed and Supabase client environment placeholders already exist in `.env.example`.

This milestone replaces the backend foundation. It does not use the live frontend as an excuse to preserve the old backend architecture.

---

## Architectural decisions

### Portfolio module ownership

The portfolio capability remains owned by:

```text
src/server/modules/portfolio/
```

Follow the mandatory module-centred backend structure from `.agents/skills/nextjs-architecture/SKILL.md`:

- services own page/use-case composition;
- repositories own persistence queries;
- providers own external SDK/provider operations;
- behavioural interfaces live under `interfaces/`;
- composed server-owned models live under `models/`;
- `public.ts` exposes only deliberate cross-module/service APIs;
- dependency construction remains in the composition root, except for the narrow seed/bootstrap adapter described below.

Do not introduce a DI container, service locator, generic repository base class, generic CMS layer or page-builder abstraction.

### Relational implementation of IconBlock specialisation

Implement the approved conceptual inheritance relationally rather than attempting ORM inheritance.

Use `IconBlock` as the reusable base record containing the approved common fields:

- icon name, nullable where an approved ActionBlock has no icon;
- label;
- optional copy;
- optional colour.

Represent `MediaBlock` and `ActionBlock` as one-to-one subtype records backed by an `IconBlock` base record. Prefer a shared-primary-key / unique one-to-one relation so a MediaBlock or ActionBlock has one identity rooted in its IconBlock base rather than duplicating common columns.

`MediaBlock` adds:

- media type;
- source;
- alt text.

`ActionBlock` adds:

- variant;
- optional URL;
- optional assistant message.

Use explicit enums for the currently approved semantic values where they improve correctness. At minimum the implementation must support:

```text
Media type: image, video
Action variant: primary, secondary, ghost, link
```

Exact database enum casing/mapping follows repository Prisma conventions.

An ActionBlock must represent a real action. Enforce, in the strongest clean mechanism appropriate to Prisma/PostgreSQL, that an action cannot silently exist with neither a URL nor an assistant message. If the invariant requires migration-level SQL rather than Prisma schema syntax, document that non-obvious choice in code or milestone completion notes.

### Ordered relationship records

Relationship-specific order must live on the relationship, not on the reusable block.

Use explicit relational/junction records for:

- ContentBlock -> IconBlock;
- ContentBlock -> MediaBlock;
- ContentBlock -> ActionBlock;
- parent ContentBlock -> child ContentBlock;
- Profile -> IconBlock collections;
- Experience -> IconBlock.

Each relationship must preserve deterministic order and prevent duplicate position collisions within the owning collection where practical.

A child ContentBlock is page content, not a globally reusable child attached to many parents. The relational implementation should prevent accidental multi-parent ownership unless a concrete approved use case requires otherwise.

There is no FlowBlock.

There is no ContentBlock -> Project relation.

There is no ContentBlock -> Experience relation.

### Profile collections

One global Profile owns ordered reusable IconBlock collections for:

- audience;
- principles;
- thinkingPrinciples;
- processPrinciples;
- controlPrinciples;
- outcomes.

Use one relationship model with a collection discriminator and relationship order rather than six structurally duplicated join-table implementations unless Prisma constraints make another design materially clearer.

The one-global-Profile invariant must be explicit. Do not implement `findFirst()` plus convention as the only protection against multiple Profiles. Use a fixed/singleton persistence invariant or an equivalent database-enforced approach and document the chosen implementation if it is not obvious from the schema.

### ContentBlock ordering

`ContentBlock.order` represents page-level ordering for top-level page sections.

Nested ContentBlocks use the parent-child relationship's order. Do not reuse a child's page-order field to encode its parent position.

The approved URL is the persisted addressable source/deep-link value. Do not reintroduce the old `ContentPage` / `ContentSection` enum architecture merely to group sections.

### Project persistence

Project must implement the approved fields:

- slug;
- title;
- category;
- problem;
- solution;
- optional outcome;
- optional cover MediaBlock relation;
- external links;
- featured;
- order;
- optional markdown;
- optional visualBlock;
- optional visualText.

`slug` is the stable unique route identifier.

The case-study route is derived from the slug and is not stored as a separate external link.

`visualBlock` stores only a known frontend visual identifier. It never stores JSX/executable code.

External links may use a typed PostgreSQL string-array representation because the approved seed artifacts provide canonical URLs and no separate link-domain entity is approved. Do not keep the legacy untyped JSON link structure merely because it already exists.

Do not invent Project covers where the approved Seed Data defines `cover: null`.

### Experience persistence

Experience must implement the approved narrative fields:

- title;
- optional tag;
- copy;
- optional insight;
- optional role;
- optional start date;
- optional end date;
- order;
- ordered reusable IconBlock relations where documented.

Do not recreate the old rigid `company/dates/category/focus` model.

### Persisted source values for Supabase media

Use one public Supabase Storage bucket for public portfolio assets. Use the repository-consistent stable bucket name:

```text
portfolio-media
```

The bucket is public because the migrated portfolio images and CV are intentionally public website assets. Do not introduce signed-URL expiry complexity for these public assets.

Store canonical Supabase-backed media source values in `MediaBlock.source` and `Profile.coverImage`. Prefer environment-correct public object URLs produced by the Supabase Storage provider after upload, or an equivalently stable source representation with one documented resolver. Do not store obsolete `/api/blob/**` values in the new seed.

The implementation must use one consistent representation for seeded managed media rather than mixing Vercel proxy paths, raw bucket paths and public URLs arbitrarily.

Document the chosen representation in completion notes because the next frontend milestone will consume it.

---

## Required behaviour

### 1. Replace only the obsolete portfolio Prisma domain

Refactor `prisma/schema.prisma` surgically.

Retain unrelated/deferred models and their current responsibilities, including:

- `Meeting`;
- `SiteChunk`;
- `SearchIndexJob`.

Introduce the approved portfolio domain persistence:

- `Profile`;
- `ContentBlock`;
- `IconBlock`;
- `MediaBlock`;
- `ActionBlock`;
- `Project`;
- `Experience`;
- only the relationship/junction persistence models required to faithfully implement the approved relationships/order.

Retire the obsolete portfolio concepts after coordinated consumer cleanup:

- old JSON `ContentBlock` model;
- `Principle` model;
- `Service` model;
- old `ContentPage` enum;
- old `ContentSection` enum;
- legacy Project fields;
- legacy Experience fields.

Do not touch unrelated database models simply to make the schema visually uniform.

### 2. Add one safe forward migration

Create a new forward migration under `prisma/migrations/`.

Do not edit, squash or delete historical migrations.

The migration must:

- remove old portfolio-only triggers/constraints/objects that would become invalid;
- retire obsolete portfolio tables/types only after their dependent triggers are handled;
- create the new portfolio tables, subtype relations, junctions, indexes and constraints;
- preserve the `meetings` table and Meeting data;
- preserve `site_chunks` and existing SiteChunk data;
- preserve `search_index_jobs` and existing SearchIndexJob rows;
- preserve the vector extension, `match_site_chunks` function and unrelated database objects;
- avoid a whole-database reset;
- avoid deleting assistant/search data merely because its source schema is being deferred.

Portfolio content records in the old content tables are disposable and do not need data migration into the new content schema. Canonical data comes from the approved Seed Data artifacts.

The migration must be valid for the repository's existing production workflow:

```text
npm run prisma:migrate:production
```

which uses committed `prisma migrate deploy` migrations.

### 3. Handle indexing-trigger compatibility safely

The old search-index migration attached job triggers to legacy portfolio tables. The new forward migration must remove or replace only what is required so no trigger references a table/model that no longer exists.

Do not create new automatic indexing semantics for the new portfolio domain in this milestone.

The intended safe temporary state is:

- existing SiteChunks remain readable by the assistant;
- existing SearchIndexJob rows are retained;
- new portfolio writes do not pretend to be fully indexed until the dedicated indexing milestone;
- no old-table trigger remains invalid;
- no worker path is allowed to delete the existing search corpus merely because old source records were removed.

If legacy pending portfolio indexing jobs would otherwise be claimed and destructively interpreted after the schema replacement, minimally adapt the claim/source compatibility boundary so those legacy jobs remain non-destructive and preserved for later reconciliation.

Do not redesign queue retries, worker lifecycle, chunking, embeddings, vector dimensions or search thresholds.

### 4. Replace the old seed architecture

Remove the old runtime-style `PortfolioSeedRepository` / `PortfolioSeedService` seed stack and old seed datasets.

Use a simple database bootstrap owned by the Prisma/seed workflow. The canonical seed source belongs under the database seed workflow, not in runtime `src/data` and not in `content/portfolio/**`.

Prefer a direct Prisma transaction/bootstrap adapter over recreating runtime repository/service abstractions solely for seeding.

The narrow seed/bootstrap adapter may directly coordinate the configured Prisma client and Supabase Storage provider/client needed for bootstrap. It must not import the full application composition root if doing so would require unrelated OpenAI/Calendar configuration.

`prisma.config.ts` must point to the new canonical seed/bootstrap entrypoint.

### 5. Seed canonical shared records

Transcribe the four approved Notion Seed Data artifacts exactly.

The initial seed must create canonical shared records, not page-specific copies.

At minimum verify that it creates:

- one global Profile;
- one reusable `Profile.audience` collection;
- one reusable `Profile.principles` collection;
- one reusable `Profile.thinkingPrinciples` collection;
- one reusable `Profile.processPrinciples` collection;
- one reusable `Profile.controlPrinciples` collection;
- one reusable `Profile.outcomes` collection;
- all documented reusable journey/workflow IconBlocks;
- all page ContentBlocks and nested ContentBlocks with exact approved ordering;
- all documented ContentBlock IconBlock/MediaBlock/ActionBlock associations with relationship order;
- the four canonical About Experiences and their ordered IconBlocks;
- one canonical record for each approved Project across pages;
- all approved ActionBlock labels, URLs and assistant messages.

Canonical Project records include:

1. Pay4Me / WithRadius
2. Portfolio Assistant
3. Email PA
4. AcrossTheHorizon
5. Shifty
6. Self-Healing Backend Operations System

Do not seed the stale `Self-Healing Backend Operating System` title.

No seed record may contain unresolved placeholders.

### 6. Local bootstrap workflow

Introduce one clear local portfolio bootstrap command, equivalent in intent to:

```text
npm run portfolio:bootstrap:local
```

The documented local workflow must be:

```text
apply local committed/dev migration
→ bootstrap portfolio media
→ safely recreate only portfolio-domain seed records
→ verify portfolio records
```

A local reset/bootstrap may delete and recreate the new portfolio-domain records, but it must never reset or delete:

- Meeting data;
- SiteChunk data;
- SearchIndexJob data;
- unrelated tables.

The command must make its target/environment clear before destructive local portfolio-only reset behaviour.

Do not add several overlapping seed/reset/sync commands when one local bootstrap is sufficient.

### 7. Guarded one-time production bootstrap

Introduce one explicit production bootstrap command, equivalent in intent to:

```text
npm run portfolio:bootstrap:production
```

Production deployment remains two separate operations:

```text
npm run prisma:migrate:production
npm run portfolio:bootstrap:production
```

The production bootstrap must:

- use production environment configuration deliberately;
- print the target database/storage project sufficiently to avoid blind execution;
- require an explicit production confirmation flag or equivalent repository-standard guard;
- bootstrap the required public storage assets idempotently/safely;
- seed the portfolio domain only when it is in the expected uninitialised state;
- refuse to overwrite existing portfolio/admin-managed content on a repeated production run;
- use a transaction for database creation so a partial database seed does not become the expected state;
- remain a one-time bootstrap, not a recurring synchronization mechanism.

A failed/partial media upload may be safely retried. Existing correct objects should not require destructive re-upload.

### 8. Remove the old content source and sync workflow

Delete `content/portfolio/**` once all consumers have been removed or replaced.

Remove the old authoring path:

```text
content/portfolio/**
→ content:sync
→ PostgreSQL
```

Remove or replace:

- `content:sync`;
- `content:sync:production`;
- old content-sync maintenance entrypoints;
- old content-sync argument parsing used only by this workflow;
- `PortfolioContentRepository` and its interface;
- `PortfolioContentService` and its interface;
- old content schemas used only to validate the file source;
- stale documentation claiming `content/portfolio` is the editable/canonical source of truth.

The new lifecycle after bootstrap is:

```text
Approved Notion Seed Data
→ one-time seed/bootstrap implementation
→ PostgreSQL
```

and later:

```text
Admin
→ PostgreSQL
```

Do not create a replacement runtime file-to-database content sync system.

### 9. Remove stale portfolio backend code

After dependency cleanup, remove obsolete code tied only to the old portfolio model, including where no live/deferred consumer remains:

- page-specific JSON ContentBlock schemas/mappers;
- old ContentPage/ContentSection-based query logic;
- obsolete Principle persistence/repository/interface;
- obsolete Service persistence/repository/interface;
- old page-data portions of `PortfolioService`;
- old page-result/entity types that duplicate retired Prisma entities;
- old PortfolioSeedRepository/Service and interfaces;
- stale Audit/page contracts tied to the old JSON architecture;
- stale mapper/schema tests that test the retired architecture rather than current requirements.

Do not remove the storage-neutral `PortfolioAsset` concept if it remains useful to the new storage provider, but do not preserve it artificially if the public-bucket strategy makes it unnecessary.

Follow imports/consumers before deleting any candidate.

### 10. Remove archived routes and old-only components

Remove:

- `src/app/home-old/**`;
- `src/app/work-old/**`;
- `src/app/about-old/**`.

Verify actual consumers, then remove components that become unreferenced and exist only for the archived architecture. Inventory candidates include:

- `AuditOfferSection`;
- `ProofOfWorkSection`;
- `ProofOfWorkCard`;
- old `ProjectFeature`;
- old `ProjectCard`;
- old `CTASection`;
- unused `ExperienceCard`;
- unused `PrincipleCard`.

Update `src/proxy.ts` and route/proxy tests so removed routes are no longer explicitly allowed or expected.

Do not remove current live Home/Work/About/Audit section components or current custom project visuals.

### 11. Create seven domain repository boundaries

Create class/interface repository pairs for:

- ProfileRepository;
- ContentBlockRepository;
- IconBlockRepository;
- MediaBlockRepository;
- ActionBlockRepository;
- ProjectRepository;
- ExperienceRepository.

Follow repository naming and constructor injection conventions from the architecture skill.

Repositories own persistence/query behaviour only. They do not decide which records make up a page.

Expected responsibilities include:

- `ProfileRepository`: retrieve the singleton Profile and its ordered reusable collections;
- `ContentBlockRepository`: retrieve ordered top-level page ContentBlocks, nested child trees and ordered reusable-block relations;
- `IconBlockRepository`: reusable IconBlock persistence/read behaviour needed by the domain;
- `MediaBlockRepository`: MediaBlock + IconBlock-base persistence/read behaviour;
- `ActionBlockRepository`: ActionBlock + IconBlock-base persistence/read behaviour;
- `ProjectRepository`: canonical Project reads by slug/order/featured selection, including optional cover;
- `ExperienceRepository`: ordered Experience reads including ordered IconBlocks.

Do not implement speculative CRUD methods merely because the later admin will need them. Add only the read/persistence methods required by this milestone and meaningful repository verification.

Use Prisma-generated record/payload types where appropriate. Do not hand-copy persisted entity fields into parallel internal entity interfaces.

### 12. Create page-oriented read services

Create four cohesive service/interface pairs:

- `HomeService` / `IHomeService`;
- `WorkService` / `IWorkService`;
- `AboutService` / `IAboutService`;
- `AuditService` / `IAuditService`.

Each exposes one simple page read entrypoint equivalent to:

```text
getPageData()
```

Four services are intentional here because each page is a separate composition/use case with different selection rules. Do not turn each individual section into its own service.

The services compose domain repository results according to the approved Page Mappings.

Conceptually:

```text
HomeService.getPageData()
→ ProfileRepository
→ ContentBlockRepository
→ ProjectRepository
→ HomePageData
```

```text
WorkService.getPageData()
→ ProfileRepository
→ ContentBlockRepository
→ ProjectRepository
→ WorkPageData
```

```text
AboutService.getPageData()
→ ProfileRepository
→ ContentBlockRepository
→ ExperienceRepository
→ AboutPageData
```

```text
AuditService.getPageData()
→ ContentBlockRepository
→ ProjectRepository
→ AuditPageData
```

Where repository relation payloads already include related IconBlock/MediaBlock/ActionBlock records, do not refetch them through another repository simply to demonstrate every repository class.

The services must preserve the exact approved page composition/selection/order without introducing ContentBlock -> Project or ContentBlock -> Experience relations.

Do not import these configured services from the live routes in this milestone.

### 13. Keep legitimate composed page types

Retain server-owned composition models such as:

- `HomePageData`;
- `WorkPageData`;
- `AboutPageData`;
- `AuditPageData`.

These are legitimate handwritten types because they combine multiple persisted domain records and relation payloads.

Prefer composing them from Prisma-generated types/payloads rather than rewriting every persisted field by hand.

Delete handwritten Project/Experience/ContentBlock entity mirrors that exist only to duplicate Prisma records.

Keep Zod/runtime validation only where a real trust/runtime boundary remains. Do not create a Zod schema solely to mirror a trusted typed Prisma result.

### 14. Add Supabase Object Storage infrastructure

Add the maintained Supabase JavaScript SDK required for server-side Storage operations.

Configure Supabase Storage independently from Prisma/PostgreSQL:

```text
Prisma
→ Supabase-hosted PostgreSQL
```

is separate from:

```text
Supabase SDK
→ Supabase Object Storage
```

Implement:

- server-safe Supabase Storage configuration through the central environment/config infrastructure;
- a server-side Supabase client suitable for storage administration/bootstrap;
- one `portfolio-media` public bucket strategy;
- one cohesive Supabase Storage provider and provider interface owned by the portfolio capability or the clearest single backend owner;
- upload/bootstrap behaviour required by this milestone;
- public URL/source generation;
- missing-object/error normalization that does not expose raw provider errors;
- local Supabase compatibility;
- explicit production environment requirements.

Do not add Supabase Auth.

Do not add a browser Supabase client merely because the SDK is installed.

### 15. Bootstrap approved portfolio media

Inspect the current asset sources and migrate/bootstrap the existing binaries required by the approved content:

- Freeman profile portrait;
- Strength;
- Endurance;
- Community;
- Always Learning;
- CV.

The seed currently documents old Vercel-backed source references such as:

```text
/api/blob/images/me
/api/blob/images/strength-training
/api/blob/images/running
/api/blob/images/community
/api/blob/images/learning
/api/blob/pdfs/cv
```

Those values must not survive as canonical new-domain storage references.

Use stable object paths under the public `portfolio-media` bucket, for example a clear split between image and document assets. The exact filenames may follow the actual binary types discovered during implementation.

For the Profile seed:

```text
Profile.coverImage
```

must reference the migrated portrait.

For Outside Engineering MediaBlocks, `MediaBlock.source` must reference the matching migrated images.

For Project cover MediaBlocks, migrate/use only the covers defined by approved seed data. Current repo-public Project images may remain normal public static files if they are already canonical repo assets, unless the implementation chooses to bootstrap them into Supabase for consistency. Do not invent covers for null-cover Projects.

### 16. Preserve the CV without inventing a domain model

The CV is still a live site asset but the approved Domain Model has no CV/document entity.

Migrate the CV binary to Supabase Storage and preserve the existing live CV functionality through the simplest architecture-consistent config/link treatment.

Do not invent a `Document`, `CV`, `Asset` or generic CMS model solely for this file.

Record the chosen CV path/source treatment in milestone completion notes.

### 17. Remove Vercel Blob completely from portfolio runtime

After the Supabase Storage path is operational, remove Vercel Blob-specific runtime dependencies, including where no other consumer remains:

- `VercelBlobProvider`;
- Vercel Blob provider interface;
- `/api/blob/**` route/path usage;
- Vercel Blob-only service methods such as `PortfolioService.getAsset()` if no longer needed;
- Vercel Blob environment variables;
- `@vercel/blob` package dependency.

Update the existing live `siteAssetLinks` or equivalent narrow static-media configuration so the current portrait, Outside Engineering images and CV resolve through Supabase Storage without converting the pages to database-backed rendering.

This media-link change is allowed. It must not become a broader live frontend content conversion.

### 18. Minimal indexing compatibility only

Keep the entire indexing/embedding/retrieval architecture deferred.

Do not redesign:

- chunking;
- embedding generation;
- SiteChunk schema/meaning;
- SearchIndexJob retry/state machine;
- vector dimension;
- vector search threshold/count;
- search worker topology;
- Vercel search cron strategy;
- `searchWebsite` assistant tool semantics;
- assistant retrieval semantics.

Make only the smallest compatibility changes required because old portfolio Prisma models/types are being removed.

Allowed compatibility surfaces include:

- `SourceRecordRepository` compile/runtime references;
- source-document mapper compile/runtime references;
- source type contracts;
- legacy portfolio indexing trigger handling;
- job claiming safety for legacy source jobs;
- narrow tests proving the assistant can still query existing SiteChunks.

Do not map the complete new domain into embeddings yet.

Do not rebuild embeddings.

Do not full-reindex portfolio content.

Do not delete existing SiteChunks as a side effect of retiring the old portfolio tables.

If an indexing maintenance command such as rebuild/index-source cannot be meaningfully supported until the dedicated indexing milestone, make it fail closed and clearly for the affected portfolio-source path rather than silently corrupting/deleting retrieval data. Keep unaffected search/status/retrieval behaviour intact.

Document the deferred limitation in completion notes and tie it to this milestone's explicit defer boundary. Do not leave an unexplained TODO.

### 19. Refactor the composition root narrowly

Update `src/server/composition-root.ts` only as needed to instantiate/wire:

- the seven new repositories;
- HomeService;
- WorkService;
- AboutService;
- AuditService;
- Supabase Storage provider where runtime wiring requires it.

Preserve existing Assistant, Meeting, Calendar, OpenAI, logging and deferred search-index wiring except for the minimum compatibility adaptation required by this milestone.

Do not introduce a service locator or inject the entire composition root into services.

### 20. Clean package scripts

Preserve working general scripts including:

- `dev`;
- `postinstall`;
- `build`;
- `start`;
- `lint`;
- `lint:fix`;
- `format`;
- `format:check`;
- `typecheck`;
- `prisma:validate`;
- `prisma:generate`;
- `prisma:migrate:production`.

Remove obsolete content commands:

- `content:reset:local`;
- `content:sync`;
- `content:sync:production`.

Add only the clear new bootstrap commands required by this contract, normally:

```text
portfolio:bootstrap:local
portfolio:bootstrap:production
```

Keep indexing scripts present and classified as deferred. Change them only when a narrow compatibility adjustment is required to keep them safe/clear after schema replacement.

If the aggregate test script must be split/refined so portfolio backend validation can run without conflating new portfolio tests with deferred indexing redesign, make the smallest clear script change while retaining an aggregate `npm test` as required by `AGENTS.md`.

### 21. Keep live frontend rendering out of this milestone

At milestone completion, the live routes still render their current visual/content implementations:

- `/`;
- `/work`;
- `/about`;
- `/audit`.

Do not replace local/hardcoded content with `getPageData()` yet.

Do not import the new page services into those routes.

Do not redesign visual sections.

Do not rewrite custom project visuals.

Only narrow frontend/config cleanup required by archived-route deletion or Supabase media-link replacement is allowed.

### 22. Keep admin out of this milestone

Do not add:

- `/admin`;
- admin CRUD APIs/actions;
- Refine;
- content editors;
- Lucide picker;
- media upload UI;
- Supabase Auth;
- magic-link login;
- admin authorization.

The storage infrastructure created here is backend/bootstrap infrastructure only.

### 23. Completion notes

The implementation result / pull-request description must explicitly document:

- the chosen singleton Profile enforcement;
- the chosen IconBlock/MediaBlock/ActionBlock relational strategy if it differs from the preferred shared-base design above;
- the stored `MediaBlock.source` / `Profile.coverImage` representation;
- the Supabase bucket/public URL strategy;
- the CV treatment;
- the production bootstrap guard/idempotency behaviour;
- any minimal indexing compatibility adaptation and the exact deferred limitation;
- exact validation commands and outcomes.

Do not put these notes into a competing architecture specification.

---

## Constraints

- Follow `AGENTS.md` and `.agents/skills/nextjs-architecture/SKILL.md` for every file location, module boundary, interface, provider and dependency decision.
- The installed framework baseline is Next.js 16.x from the current package configuration. Do not make unnecessary framework-specific routing/cache changes in this backend milestone.
- Preserve the existing Prisma/PostgreSQL infrastructure rather than adding a second ORM or database client for relational persistence.
- Preserve `Meeting`, `SiteChunk`, `SearchIndexJob` and unrelated database objects/data.
- Historical migration files are immutable history. Add a new migration only.
- Production must never require `prisma migrate reset`, `db push --force-reset`, dropping the whole schema or recreating the entire database.
- Portfolio content in the obsolete tables is disposable; unrelated/deferred data is not.
- Database owns canonical content after initial bootstrap. Do not introduce another runtime file content source.
- Frontend owns presentation. Do not build a generic DB-driven page builder.
- Relationship order belongs to junction records where the Domain Model says it is contextual.
- Projects remain independent. No ContentBlock -> Project relation.
- Experiences remain independent. No ContentBlock -> Experience relation.
- No FlowBlock.
- Reuse shared IconBlocks where the approved Seed Data explicitly identifies reuse.
- Use canonical Project/Experience/Profile values from Notion exactly.
- No unresolved seed placeholders.
- Repository classes implement corresponding interfaces and own persistence only.
- Services depend on repository/provider/service interfaces through constructor injection.
- Runtime portfolio services/repositories/providers must not import the composition root.
- Do not create duplicate handwritten persisted-entity models when Prisma-generated types/payloads are sufficient.
- Use runtime schemas only for genuine trust/unstructured boundaries.
- Keep secrets server-only. Supabase service/admin credentials must never use `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_SUPABASE_URL` is allowed because the Supabase project URL is intentionally public and may be required for current public media URLs.
- Do not expose raw Supabase, Prisma or provider errors to clients.
- Remove dead code/dependencies/tests/docs in the same milestone that replaces them.
- Do not change milestone checklist boxes during implementation.

---

## Explicitly out of scope

- Wiring `HomeService.getPageData()` into `/`.
- Wiring `WorkService.getPageData()` into `/work`.
- Wiring `AboutService.getPageData()` into `/about`.
- Wiring `AuditService.getPageData()` into `/audit`.
- Replacing live hardcoded/local page content with database data.
- Redesigning existing Home/Work/About/Audit presentation.
- Rebuilding custom project visual components or the future visual registry beyond persisting approved `visualBlock` identifiers.
- `/admin`.
- Admin CRUD UI or APIs.
- Refine.
- Supabase Auth.
- Magic-link login.
- Admin authorization.
- Browser media-upload UI.
- Dynamic cache invalidation/revalidation strategy for future admin edits.
- Generic page-builder/CMS functionality.
- Search-index architecture redesign.
- New full-domain source-document mapping design.
- Embedding regeneration.
- Full content re-index.
- Search threshold/vector dimension/chunking changes.
- Assistant prompt/tool/redesign work.
- Meeting or Google Calendar changes.
- Migration of unrelated database models.
- New Project covers not approved by Seed Data.
- A new CV/document domain model.
- Recurring production content synchronization.

---

## Required tests

### Prisma and migration

1. `prisma validate` passes with the new domain schema.
2. Prisma client generation passes.
3. A fresh database can apply the full historical migration chain plus Milestone 15's new forward migration.
4. A representative pre-Milestone-15 database can apply only the new forward migration without a whole-database reset.
5. Migration verification proves `Meeting`, `SiteChunk` and `SearchIndexJob` rows survive.
6. Old portfolio-only triggers/types/tables that must be retired are removed without dropping unrelated database objects.
7. New subtype/junction constraints reject invalid duplicate ordering/relations where the schema promises uniqueness.
8. The singleton Profile invariant is tested.

Use a disposable/local database fixture for migration tests where practical. Do not point automated destructive tests at production.

### Seed/bootstrap

1. Local bootstrap produces exactly one Profile.
2. Profile core values match approved Notion Seed Data.
3. Profile reusable collections contain the exact approved items/order.
4. Shared journey/workflow IconBlocks are reused rather than duplicated.
5. All top-level page ContentBlocks have the approved page order.
6. Child ContentBlock relationship order matches the approved Seed Data.
7. ContentBlock IconBlock/MediaBlock/ActionBlock relationship order is correct.
8. All approved ActionBlock labels, URLs and assistant messages are exact.
9. The four canonical Experiences exist once in approved order with the correct related IconBlocks.
10. The six canonical Projects exist once with exact approved canonical fields.
11. No ContentBlock -> Project relationship exists.
12. No ContentBlock -> Experience relationship exists.
13. `Profile.coverImage` is populated with the Supabase-backed portrait source representation.
14. Outside Engineering MediaBlocks use Supabase-backed sources.
15. Project cover data exists only where approved.
16. Local bootstrap can deliberately recreate only portfolio data without deleting protected/deferred rows.
17. Production bootstrap guard refuses to overwrite a non-empty/already-initialised portfolio domain.
18. Database seed transaction failure does not leave a partially seeded expected state.

### Repositories

Add focused tests for meaningful repository behaviour, including:

- singleton Profile retrieval with ordered collections;
- ordered page ContentBlock tree retrieval;
- ordered reusable relations;
- Project reads/order/slug selection and cover relation;
- Experience reads/order/IconBlock relations;
- MediaBlock/ActionBlock subtype reads.

Do not test private Prisma call order merely to increase coverage.

### Page services

Test the public behaviour of all four services:

- `HomeService.getPageData()`;
- `WorkService.getPageData()`;
- `AboutService.getPageData()`;
- `AuditService.getPageData()`.

Verify each result matches the approved Page Mapping composition and selection order.

At minimum verify:

- Home includes Profile audience and independent Pay4Me / Portfolio Assistant / Email PA project selection;
- Work includes Profile outcomes and the correct independent Project selections/groups without a persisted ContentBlock relation;
- About includes Profile collections and the four independent Experiences in approved order;
- Audit includes the three independent Proof Projects in approved order;
- nested ContentBlocks and ordered reusable blocks are present in each page result.

Do not test React presentation in this milestone.

### Supabase Storage

Use a fake/injected Supabase Storage seam for automated unit tests unless a local Supabase instance is explicitly available.

Test:

1. required bucket/object-path selection;
2. upload/bootstrap input and content-type handling;
3. safe handling of an already-present correct asset;
4. public source/URL generation;
5. missing-object behaviour;
6. provider/configuration error normalization;
7. server-only secret configuration validation.

A mocked/fake test does not prove the production bucket contains the real assets. That is a manual acceptance criterion below.

### Archived-route and dependency cleanup

Test or statically verify:

- `/home-old`, `/work-old`, `/about-old` are removed;
- `src/proxy.ts` no longer allows them;
- route tests reflect the new allowlist;
- no current live route imports old page-data services;
- `content/portfolio/**` is gone;
- `content:sync*` scripts are gone;
- `@vercel/blob` and Blob env vars are gone when no other consumer exists;
- no `/api/blob/**` route/reference remains;
- old-only components/types/interfaces have no dangling imports.

### Deferred indexing compatibility

Add only focused regression coverage needed to prove:

- search-index code compiles without old Prisma portfolio models;
- existing SiteChunk search remains callable;
- existing SiteChunk rows are not deleted by the forward migration/bootstrap;
- legacy portfolio triggers are not left invalid;
- legacy pending portfolio jobs are not processed in a way that deletes the existing indexed corpus;
- no embedding generation/rebuild is required by Milestone 15 tests.

### Repository validation

Run the repository-standard validation commands from `AGENTS.md` after implementation:

```text
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run build
```

Also run the focused migration/bootstrap/storage tests added for this milestone.

Report exact commands and outcomes. Use `NOT VERIFIED` for real external/local integrations that could not be exercised because required infrastructure or credentials were unavailable.

---

## Acceptance criteria

These criteria are agent-verifiable from repository evidence, automated tests, local disposable infrastructure when available, CI or accessible runtime behaviour. Production-credential checks are listed separately under Manual acceptance criteria.

- [ ] `prisma/schema.prisma` contains the approved portfolio domain persistence for Profile, ContentBlock, IconBlock, MediaBlock, ActionBlock, Project and Experience plus only required relationship/junction models.
- [ ] The old portfolio `Principle`, `Service`, ContentPage/ContentSection and legacy JSON ContentBlock architecture are retired.
- [ ] `Meeting`, `SiteChunk` and `SearchIndexJob` remain present and compatible with their existing responsibilities.
- [ ] A new forward migration exists; historical migrations are unchanged.
- [ ] The new migration does not require or perform a whole-database reset.
- [ ] Migration tests/evidence demonstrate protected unrelated/deferred rows survive on a representative local/disposable database.
- [ ] Invalid old portfolio indexing triggers are removed or safely neutralised without redesigning indexing.
- [ ] Existing SiteChunk data is not deleted as part of portfolio migration/bootstrap.
- [ ] Legacy pending indexing jobs cannot destructively remove the existing indexed corpus after the old source tables are retired.
- [ ] The canonical seed/bootstrap implementation reads/transcribes only the approved Notion seed values and contains no unresolved placeholders.
- [ ] One canonical Profile is created with the approved core values and coverImage representation.
- [ ] All approved Profile reusable collections exist with exact ordering and reuse semantics.
- [ ] ContentBlock page order, child relationship order and reusable-block relationship order match the approved seed artifacts.
- [ ] All canonical Experiences exist exactly once in approved order.
- [ ] Pay4Me / WithRadius, Portfolio Assistant, Email PA, AcrossTheHorizon, Shifty and Self-Healing Backend Operations System exist exactly once with approved canonical fields/order.
- [ ] No duplicate stale `Self-Healing Backend Operating System` Project exists.
- [ ] No ContentBlock -> Project relation exists.
- [ ] No ContentBlock -> Experience relation exists.
- [ ] All seven required domain repository class/interface pairs exist and focused repository tests pass.
- [ ] HomeService, WorkService, AboutService and AuditService class/interface pairs exist and `getPageData()` tests match approved page composition.
- [ ] Composed page types remain legitimate application types while duplicate persisted-entity mirrors are removed.
- [ ] Supabase Storage SDK/config/provider infrastructure exists without introducing Supabase Auth or a browser admin client.
- [ ] The configured portfolio bucket strategy is `portfolio-media` and public-asset behaviour is documented/tested.
- [ ] Media bootstrap code covers portrait, Strength, Endurance, Community, Always Learning and CV.
- [ ] New seed values do not contain `/api/blob/**` references for managed Profile/MediaBlock assets.
- [ ] Vercel Blob provider/interface/route/env/package dependency are removed when no non-portfolio consumer exists.
- [ ] Current live site media-link configuration no longer depends on Vercel Blob.
- [ ] CV functionality has a Supabase-backed replacement path and no unnecessary new CV/document domain model was introduced.
- [ ] `content/portfolio/**` and the old file-to-database content-sync implementation are removed.
- [ ] `content:sync` and `content:sync:production` are removed from `package.json`.
- [ ] The package exposes only the small new local/production portfolio bootstrap command set required by this milestone.
- [ ] `/home-old`, `/work-old` and `/about-old` are removed.
- [ ] `src/proxy.ts` and relevant tests no longer expose/reference the removed archived routes.
- [ ] Components/types/interfaces used only by the retired archived/backend architecture are removed after consumer verification.
- [ ] The composition root wires the new repositories/page services/storage provider without disturbing unrelated Assistant/Meeting/Calendar/OpenAI wiring beyond required compatibility changes.
- [ ] Search indexing/embedding/retrieval has not been redesigned and no full re-index/embedding regeneration is part of the milestone.
- [ ] Any indexing changes are limited to compile/runtime/migration compatibility and are documented as deferred limitations.
- [ ] The live `/`, `/work`, `/about` and `/audit` routes retain their existing presentation/content implementation and do not call the new page services yet.
- [ ] No admin UI, admin API, Supabase Auth, magic-link login or authorization implementation was introduced.
- [ ] `npm run prisma:validate` passes.
- [ ] `npm run prisma:generate` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes in the implementation environment, or is reported `NOT VERIFIED` only when a documented external/local infrastructure prerequisite prevents it after all compile-time/build code issues are resolved.
- [ ] The complete independent milestone review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

---

## Manual tasks

These tasks require Freeman's local/production Supabase access or production credentials. They remain unchecked in the contract and do not prevent the workflow from reaching `ready_for_human`.

1. **Local migration/bootstrap verification using a real local Supabase/PostgreSQL instance**

   Configure the documented local environment, then run the exact commands produced by the implementation. The expected workflow is equivalent to:

   ```text
   apply the committed/dev migration locally
   npm run portfolio:bootstrap:local
   ```

   Verify the portfolio records/media against the local Supabase project and confirm protected data is untouched.

2. **Production migration deployment**

   With `.env.production.local` targeting the intended production database, run:

   ```text
   npm run prisma:migrate:production
   ```

   Do not use `migrate reset`, `db push --force-reset` or a whole-database reset.

3. **One-time production portfolio bootstrap**

   After the production migration succeeds, run:

   ```text
   npm run portfolio:bootstrap:production
   ```

   Confirm the command identifies the intended production target and requires the documented production guard/confirmation.

4. **Production data/storage verification**

   Verify in Supabase that:

   - the new portfolio domain records exist;
   - `meetings`, `site_chunks` and `search_index_jobs` still contain their pre-migration data;
   - the `portfolio-media` bucket contains the portrait, four Outside Engineering images and CV;
   - the public media URLs resolve.

5. **Production live-site smoke check**

   Verify the current live `/`, `/work`, `/about` and `/audit` pages still look/behave as before this milestone, except that their portrait/Outside Engineering/CV asset delivery now comes from Supabase rather than Vercel Blob.

6. **Production bootstrap repeat guard**

   Attempt the documented non-destructive verification/dry-run path or otherwise confirm the production bootstrap refuses to overwrite an already-initialised portfolio domain. Do not force a second seed over real content.

---

## Manual acceptance criteria

These outcomes require real Supabase/production access or human visual judgement.

- [ ] The new forward migration deploys successfully to the intended production database without resetting the database.
- [ ] Existing Meeting records remain present after production migration/bootstrap.
- [ ] Existing SiteChunk records remain present and assistant website retrieval still returns existing indexed content after production migration/bootstrap.
- [ ] Existing SearchIndexJob rows are preserved and no invalid legacy portfolio trigger causes production write/worker errors.
- [ ] The one-time production bootstrap creates the approved canonical portfolio data without duplicate Projects/Experiences/Profile records.
- [ ] The `portfolio-media` bucket contains the real Freeman portrait, Strength, Endurance, Community, Always Learning and CV binaries.
- [ ] `Profile.coverImage` resolves to the real Supabase-backed portrait.
- [ ] Outside Engineering MediaBlock sources resolve to the correct Supabase-backed images.
- [ ] The CV remains downloadable/openable from the live site after Vercel Blob removal.
- [ ] Re-running the production bootstrap without an explicit safe reset/force path does not overwrite the initialised portfolio content.
- [ ] The live `/`, `/work`, `/about` and `/audit` pages retain their current presentation and content behaviour; only the required media-delivery dependency has changed.
