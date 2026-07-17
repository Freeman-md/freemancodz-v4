# Milestone 2 Amendment 1: Consolidate Portfolio Page Content

**Status:** Frozen  
**Version:** 1.0.0  
**Last Updated:** 2026-07-17  
**Parent Milestone:** `.ai/milestones/milestone-2.md`  
**Target Pull Request:** `#3`  
**Target Branch:** `feat/milestone-2-seed-portfolio-data`  
**Cycle Scope:** `milestone-2-amendment-1`  
**Maximum Amendment Cycles:** `3`

## Reason

The current database separates one-off portfolio copy into `Profile`, `Education` and a limited `ContentItem` model even though these records are all typed page content. This produces arbitrary boundaries, allows multiple profile and education rows that the application does not need, and makes future page loading depend on several unrelated singleton tables.

This amendment replaces those three models with one typed `ContentBlock` model. The block's stable key, page, section, position and JSON payload identify what the content is and where it belongs. Existing static data remains the canonical seed source for this milestone and its current property shapes should be preserved so focused runtime schemas can validate those payloads in a later milestone.

## Target mental model

The amendment should produce this bounded model:

```text
ContentBlock
  key
  page
  section
  position
  content

Service
Principle
Experience
Project
SiteChunk
```

`Profile`, `Education` and the current `ContentItem` model no longer remain as separate database concepts.

The target Prisma shape should follow this model closely:

```prisma
enum ContentPage {
  HOME  @map("home")
  ABOUT @map("about")

  @@map("content_page")
}

enum ContentSection {
  HERO                @map("hero")
  PHILOSOPHY          @map("philosophy")
  CURRENT_DIRECTION   @map("current_direction")
  ABOUT_HEADER        @map("about_header")
  ABOUT_INTRO         @map("about_intro")
  EDUCATION           @map("education")
  WORK_PROCESS        @map("work_process")
  OUTSIDE_ENGINEERING @map("outside_engineering")

  @@map("content_section")
}

model ContentBlock {
  id        String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  key       String         @unique
  page      ContentPage
  section   ContentSection
  position  Int            @default(0)
  content   Json           @db.JsonB
  createdAt DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime       @default(now()) @map("updated_at") @db.Timestamptz(6)

  @@unique([page, section, position])
  @@index([page, section, position])
  @@map("content_blocks")
}
```

Exact formatting may follow the repository, but the model names, responsibilities and stored meaning above are binding.

## Changed requirements

### Prisma schema

- Remove the `Profile`, `Education` and existing `ContentItem` models.
- Add `ContentPage` and `ContentSection` Prisma enums using the values shown in the target model.
- Add the `ContentBlock` model with:
  - a generated UUID primary key;
  - a stable unique `key`;
  - a typed `page`;
  - a typed `section`;
  - a non-negative `position` represented in the SQL migration;
  - a required JSONB `content` payload;
  - the existing timestamp conventions;
  - a unique constraint across `page`, `section` and `position`;
  - an index across `page`, `section` and `position`.
- Keep `Service`, `Principle`, `Experience`, `Project` and `SiteChunk` as dedicated models.
- Do not merge services, principles, experiences, projects or site chunks into `ContentBlock`.
- Do not add speculative `url`, `route`, `slug`, `source`, relation or ownership fields. `page`, `section` and `key` are sufficient for the current portfolio.
- Do not add section-specific nullable columns to `ContentBlock`.
- Do not encode JSON payload shapes through a growing set of SQL checks. Payload validation belongs at the application boundary in a later milestone.

### Supabase migration

- Add a new forward Supabase migration for this amendment rather than rewriting the already-merged migration history.
- Create the PostgreSQL enum types represented by `ContentPage` and `ContentSection`.
- Create `public.content_blocks` so it matches the Prisma model and uses JSONB for `content`.
- Enforce `position >= 0`, the unique content key and the unique `(page, section, position)` tuple.
- Add the `(page, section, position)` index.
- Apply the repository's existing security posture to `content_blocks`:
  - enable row-level security;
  - revoke access from `anon` and `authenticated`;
  - add the standard `updated_at` trigger using `public.set_updated_at()`.
- Remove the obsolete `public.profiles`, `public.educations` and `public.content_items` tables as part of the forward migration.
- Do not embed the portfolio's content values or duplicate the TypeScript seed mapping inside SQL.
- Do not add complex SQL data-copy logic from the obsolete tables. The static TypeScript data remains canonical and the amended seed command repopulates the final schema after migration.
- Ensure a clean database applying the full migration history finishes with `content_blocks` and without `profiles`, `educations` or `content_items`.

### Seed data

- Update the existing seed mapping to return `contentBlocks` instead of `profiles`, `educations` and `contentItems`.
- Preserve the current static profile module and its property types. Do not reshape the static source files to imitate the database model.
- Preserve the static property names inside JSON payloads where a structured static object already exists. This keeps later schema validation directly aligned with the current TypeScript content types.
- Seed the following deterministic blocks and keys:

| Key | Page | Section | Position | JSON payload |
| --- | --- | --- | ---: | --- |
| `home.hero` | `HOME` | `HERO` | `0` | `{ name, headline, intro, heroNote }` |
| `home.philosophy` | `HOME` | `PHILOSOPHY` | `0` | `{ philosophyQuestion }` |
| `home.current-direction` | `HOME` | `CURRENT_DIRECTION` | `0` | `{ currentDirection, currentDirectionSupport }` |
| `about.header` | `ABOUT` | `ABOUT_HEADER` | `0` | `{ aboutHeadline }` |
| `about.education` | `ABOUT` | `EDUCATION` | `0` | `{ current, previous, research, support }` |

- Seed each `profile.aboutIntro` string as an ordered block:

```text
key:      about.intro.<position>
page:     ABOUT
section:  ABOUT_INTRO
position: zero-based source position
content:  { body }
```

- Seed each `profile.workProcess` string as an ordered block:

```text
key:      about.work-process.<position>
page:     ABOUT
section:  WORK_PROCESS
position: zero-based source position
content:  { body }
```

- Seed each `profile.outsideEngineering` item as an ordered block while preserving its static field names:

```text
key:      about.outside-engineering.<position>
page:     ABOUT
section:  OUTSIDE_ENGINEERING
position: zero-based source position
content:  { title, description }
```

- Continue mapping services, principles, experiences and projects to their existing dedicated models.
- Update the seed transaction to delete and create `ContentBlock` records and remove all `Profile`, `Education` and `ContentItem` operations.
- Preserve the seed's repeatable replace-all behaviour so re-running it produces the same final content without duplicates.
- Keep failure reporting and database cleanup behaviour intact.

### Seed command and documentation

- Keep the documented `seed:portfolio` command.
- Update seed and migration documentation to name `content_blocks` and describe the amended manual sequence: apply migrations, then run the portfolio seed.
- Remove references that instruct the user to inspect separate profile, education or content-item tables.
- Document that the seed is required after the amendment migration because the migration intentionally changes the schema without embedding portfolio data.

### Test scope correction

- Remove the committed `scripts/tests/portfolio-seed.test.ts` file introduced by the current pull request.
- Remove the `test:seed` package script when it exists only to run that file.
- Do not replace it with another committed portfolio-seed unit or integration test suite.
- Implementation and review agents may create temporary, untracked checks to inspect the mapping or seed behaviour, but those files must be removed before completion.
- Validation for this amendment should remain proportionate: schema validation, Prisma Client generation, lint, typecheck, migration verification where infrastructure is available, and the human seed run described below.

## Behaviour that must not change

- The public site must continue rendering from the existing static data files during Milestone 2.
- The static profile, service, principle, experience and project values and TypeScript-facing shapes must remain unchanged.
- The static files remain the source passed into the seed mapping.
- `Service`, `Principle`, `Experience`, `Project` and `SiteChunk` fields and responsibilities remain unchanged.
- Project stacks remain a string array and project links remain JSON.
- The seed command remains safe to run again without creating duplicate portfolio records.
- Database credentials, generated secrets and environment files must not be committed.
- Existing Supabase RLS, access-revocation and timestamp-trigger conventions remain intact.
- Reading or rendering portfolio content from Supabase remains outside Milestone 2.

## Explicitly out of scope

- Runtime Zod or other application schemas for content-block payloads
- Database-backed rendering of `/`, `/work` or `/about`
- Loading states, error boundaries or static pre-rendering changes
- Removing or changing the current static content files or their exported property types
- Converting `Service`, `Principle`, `Experience`, `Project` or `SiteChunk` into generic content blocks
- Adding a CMS, content editor or administration interface
- Adding page URLs, routes, sources, owners or relations to `ContentBlock`
- Automatic seeding during deployment
- Embedding generation or `SiteChunk` redesign
- Retrieval, RAG or assistant-response changes
- A permanent portfolio seed test suite
- Unrelated application refactoring

## Required validation

1. `prisma validate` succeeds with `ContentBlock`, `ContentPage` and `ContentSection` and without `Profile`, `Education` or `ContentItem`.
2. Prisma Client generation succeeds and exposes the amended model and enums.
3. The forward migration reaches the target schema on a clean database when local Supabase infrastructure is available.
4. The final migrated schema contains `content_blocks` with its enum columns, JSONB payload, constraints, index, RLS, access revocations and timestamp trigger.
5. The final migrated schema does not contain `profiles`, `educations` or `content_items`.
6. Static inspection confirms the seed mapping covers every required singleton and ordered content block with deterministic keys and positions.
7. Static inspection confirms the seed transaction no longer reads or writes obsolete Prisma models.
8. Lint and typecheck remain green.
9. No permanent portfolio seed test file or replacement test suite is committed.

## Acceptance criteria

- [ ] Prisma contains the exact bounded content-block enums and model responsibilities described by this amendment.
- [ ] `Profile`, `Education` and `ContentItem` are removed from Prisma.
- [ ] `Service`, `Principle`, `Experience`, `Project` and `SiteChunk` remain dedicated and materially unchanged.
- [ ] A new forward migration creates `content_blocks` and removes the three obsolete tables.
- [ ] The migration applies the required constraints, index, RLS, revocations and updated-at trigger.
- [ ] No static portfolio values are duplicated inside the SQL migration.
- [ ] The seed maps the current static profile content into the specified deterministic content blocks.
- [ ] Structured JSON payloads preserve the relevant static property names.
- [ ] Ordered sections preserve their zero-based source ordering.
- [ ] The seed transaction uses `ContentBlock` and contains no obsolete profile, education or content-item operations.
- [ ] Re-running the seed retains the parent milestone's no-duplicate behaviour.
- [ ] The existing `seed:portfolio` command and updated operational documentation remain available.
- [ ] The committed portfolio-seed test and its dedicated package command are removed.
- [ ] No replacement permanent portfolio seed test suite is introduced.
- [ ] Existing static site rendering remains unchanged.
- [ ] Unchanged parent milestone requirements still hold unless this amendment explicitly replaces them.
- [ ] No unrelated work was introduced.
- [ ] Required validation passes.
- [ ] The independent review covers the parent milestone and this amendment.
- [ ] The pull request is not merged by an agent.

## Manual tasks

1. Set `DATABASE_URL` to the intended local or hosted Supabase PostgreSQL database.
2. Apply the complete Supabase migration history, including the amendment migration.
3. Run `npm run seed:portfolio`.
4. Inspect `content_blocks`, `services`, `principles`, `experiences` and `projects`.
5. Run `npm run seed:portfolio` a second time and inspect the same tables again.

## Manual acceptance criteria

- [ ] The migration completes successfully and the obsolete `profiles`, `educations` and `content_items` tables are absent.
- [ ] `content_blocks` contains the expected singleton and ordered records with the specified keys, pages, sections, positions and JSON payloads.
- [ ] Services, principles, experiences and projects still match the current static data.
- [ ] The second seed run completes successfully without duplicate records or changed ordering.
