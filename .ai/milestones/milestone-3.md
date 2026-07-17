# Milestone 3: Pre-render Portfolio Data from Supabase

**Status:** Frozen  
**Version:** 1.1.0  
**Last Updated:** 2026-07-17  
**Depends On:** Milestone 2 and Milestone 2 Amendment 1  
**Target Pull Request:** —  
**Target Branch:** —  
**Superseded By:** —

## Goal

Replace the public portfolio pages' static rendering source with server-only Prisma reads from the seeded Supabase database, while ensuring the home, work and about pages are pre-rendered into complete static HTML during the production build.

This milestone changes how portfolio data is queried, validated, mapped and composed. It is not a visual redesign. The existing page structure, components, styling, metadata, ordering, interactions and user-visible content must remain intact.

## Current data model

Milestone 2 Amendment 1 replaced the previous `Profile`, `Education` and `ContentItem` models with `ContentBlock`.

`ContentBlock` stores flexible page content through:

- a stable unique `key`
- a `page` enum
- a `section` enum
- a `position`
- a JSON `content` payload

Dedicated models remain for:

- `Project`
- `Experience`
- `Principle`
- `Service`
- `SiteChunk`

Milestone 3 must use the current schema and must not reintroduce assumptions based on removed profile, education or content-item tables.

## Required behaviour

- Add a small server-only portfolio feature that reads seeded portfolio data through the existing Prisma client.
- Separate database queries, database-to-UI mapping, JSON schemas and page-level data composition into focused modules.
- Ensure each function and module has one clear responsibility.
- Add separate page loaders for the home, work and about pages.
- Keep raw Prisma queries outside page components.
- Keep database record transformation outside page components.
- Avoid placing all portfolio queries, schemas, mappings and page composition in one general-purpose file.
- Fetch only the records required by each page.
- Run independent page reads concurrently where practical.
- Use one focused `content-blocks.query.ts` module for ContentBlock reads.
- Keep separate query functions inside that module for stable-key lookups and ordered page-section lookups.
- Retrieve singleton content by stable key rather than by arbitrary row count.
- Retrieve repeatable content by `page` and `section`, ordered by `position` ascending.
- Validate the expected `key`, `page` and `section` identity of every required singleton ContentBlock.
- Validate every `ContentBlock.content` JSON payload before exposing it to mappers, loaders or presentation code.
- Fail clearly when a required ContentBlock is missing, has an unexpected page or section, or contains malformed JSON.
- Fetch services, principles, experiences and projects in their stored `position` order.
- Preserve the current featured and non-featured project grouping.
- Validate project-link JSON at the database boundary.
- Report a clear error identifying the affected project when stored project links are malformed.
- Map database records into the existing component-facing shapes where practical.
- Allow small page-facing type or prop adjustments only where required to adapt the new database structure to the existing UI.
- Convert database null values into the existing optional UI properties without changing rendered behaviour.
- Update `/`, `/work` and `/about` to use their respective server-side page loaders.
- Ensure `/`, `/work` and `/about` remain Server Components and are pre-rendered during the production build.
- Ensure the rendered HTML contains the portfolio content without client-side fetching, hydration-time fetching or a loading-time database request.
- Add meaningful loading UI for the affected route segments.
- Add a user-safe error boundary for unexpected route-rendering failures.
- Fail the production build clearly when required database content cannot be loaded or validated.
- Keep the existing static content files available for the seed and existing RAG workflows, but stop importing them as the rendering source of `/`, `/work` and `/about`.
- Document the database environment requirements and production-build verification process.

## Required ContentBlock identities

The implementation must read and validate the following singleton blocks by key:

| Key | Page | Section |
| --- | --- | --- |
| `home.hero` | `HOME` | `HERO` |
| `home.philosophy` | `HOME` | `PHILOSOPHY` |
| `home.current-direction` | `HOME` | `CURRENT_DIRECTION` |
| `about.header` | `ABOUT` | `ABOUT_HEADER` |
| `about.education` | `ABOUT` | `EDUCATION` |

The implementation must read the following repeatable sections by page and section, ordered by `position` ascending:

| Page | Section |
| --- | --- |
| `ABOUT` | `ABOUT_INTRO` |
| `ABOUT` | `WORK_PROCESS` |
| `ABOUT` | `OUTSIDE_ENGINEERING` |

## ContentBlock payload schemas

Every `ContentBlock.content` value is a Prisma JSON boundary and must be parsed into a typed value before it reaches page composition or UI code.

Schemas must cover the current seeded payloads:

- hero
- philosophy
- current direction
- about header
- education
- text block used by about intro and work process
- outside engineering item

The implementation may reuse one schema where payload shapes are genuinely identical. It must not use one permissive catch-all schema for unrelated sections.

A malformed payload must produce a clear error identifying the affected content key or section.

## Implementation mental model

The following structure is illustrative. The implementation agent should inspect the repository and preserve existing conventions while keeping equivalent responsibility boundaries.

```text
src/features/portfolio/
├── data/
│   ├── content-blocks.query.ts
│   ├── principles.query.ts
│   ├── services.query.ts
│   ├── experiences.query.ts
│   └── projects.query.ts
├── schemas/
│   ├── content-blocks/
│   │   ├── hero.schema.ts
│   │   ├── philosophy.schema.ts
│   │   ├── current-direction.schema.ts
│   │   ├── about-header.schema.ts
│   │   ├── education.schema.ts
│   │   ├── text-block.schema.ts
│   │   └── outside-engineering.schema.ts
│   └── project-links.schema.ts
├── mappers/
│   ├── content-block.mapper.ts
│   ├── experience.mapper.ts
│   └── project.mapper.ts
├── loaders/
│   ├── home-page.loader.ts
│   ├── work-page.loader.ts
│   └── about-page.loader.ts
└── types.ts
```

The intent is:

- query modules only read from Prisma
- schema modules validate unsafe JSON boundaries
- mapper modules convert validated database records into UI-facing values
- page loaders compose smaller queries, schemas and mappers for one route
- page components request page data and render it

`content-blocks.query.ts` may contain multiple focused ContentBlock query functions. This does not violate single responsibility because the module remains responsible only for ContentBlock reads.

## Query examples

A stable-key query should return one deterministic ContentBlock and make missing content explicit:

```ts
export async function findRequiredContentBlockByKey(key: string) {
  const block = await prisma.contentBlock.findUnique({
    where: { key },
  });

  if (!block) {
    throw new Error(`Required content block not found: ${key}`);
  }

  return block;
}
```

A repeatable-section query should preserve page and section boundaries and ordering:

```ts
export async function findContentBlocksBySection(
  page: ContentPage,
  section: ContentSection,
) {
  return prisma.contentBlock.findMany({
    where: { page, section },
    orderBy: { position: "asc" },
  });
}
```

A regular ordered query remains focused:

```ts
export async function findProjects() {
  return prisma.project.findMany({
    orderBy: { position: "asc" },
  });
}
```

## ContentBlock identity example

A required singleton block must be checked against the identity expected by the loader:

```ts
export function assertContentBlockIdentity(
  block: ContentBlockRecord,
  expected: {
    key: string;
    page: ContentPage;
    section: ContentSection;
  },
) {
  if (
    block.key !== expected.key ||
    block.page !== expected.page ||
    block.section !== expected.section
  ) {
    throw new Error(`Unexpected content block identity: ${expected.key}`);
  }
}
```

The exact helper shape is an implementation choice. The behaviour is required.

## Schema example

```ts
export function parseHeroContent(value: unknown, key: string) {
  const result = heroSchema.safeParse(value);

  if (!result.success) {
    throw new Error(`Invalid content stored for block: ${key}`);
  }

  return result.data;
}
```

Project links remain a separate JSON boundary:

```ts
export function parseProjectLinks(value: unknown, projectTitle: string) {
  const result = projectLinksSchema.safeParse(value);

  if (!result.success) {
    throw new Error(`Invalid links stored for project: ${projectTitle}`);
  }

  return result.data;
}
```

The accepted project-link output shape remains:

```ts
type ProjectLink = {
  label: string;
  href: string;
};
```

## Mapper example

A mapper should convert one database record or one validated content payload and must not query the database.

```ts
export function mapProject(record: ProjectRecord): Project {
  return {
    title: record.title,
    summary: record.summary,
    category: record.category,
    stack: [...record.stacks],
    role: record.role,
    outcome: record.outcome,
    links: parseProjectLinks(record.links, record.title),
    detail: record.detail,
    future: record.future ?? undefined,
    collaboration: record.collaboration ?? undefined,
    positioning: record.positioning ?? undefined,
    featured: record.featured,
  };
}
```

ContentBlock mappers should keep database metadata and Prisma JSON out of page components. They may expose page-specific values instead of reconstructing one broad profile object when that keeps the implementation simpler.

## Page-loader examples

A page loader should compose only the data required by its route. Independent reads should run concurrently where practical.

### Home

```ts
export async function getHomePageData() {
  const [
    heroBlock,
    philosophyBlock,
    currentDirectionBlock,
    services,
    principles,
    projects,
    experiences,
  ] = await Promise.all([
    findRequiredContentBlockByKey("home.hero"),
    findRequiredContentBlockByKey("home.philosophy"),
    findRequiredContentBlockByKey("home.current-direction"),
    findServices(),
    findPrinciplesBySection("home"),
    findFeaturedProjects(),
    findExperiences(),
  ]);

  return {
    hero: mapHeroBlock(heroBlock),
    philosophy: mapPhilosophyBlock(philosophyBlock),
    currentDirection: mapCurrentDirectionBlock(currentDirectionBlock),
    services: services.map(mapService),
    principles: principles.map(mapPrinciple),
    featuredProjects: projects.map(mapProject),
    experiences: experiences.map(mapExperience),
  };
}
```

### Work

```ts
export async function getWorkPageData() {
  const records = await findProjects();
  const projects = records.map(mapProject);

  return {
    featuredProjects: projects.filter((project) => project.featured),
    otherProjects: projects.filter((project) => !project.featured),
  };
}
```

### About

```ts
export async function getAboutPageData() {
  const [
    headerBlock,
    educationBlock,
    introBlocks,
    workProcessBlocks,
    outsideEngineeringBlocks,
    principles,
  ] = await Promise.all([
    findRequiredContentBlockByKey("about.header"),
    findRequiredContentBlockByKey("about.education"),
    findContentBlocksBySection("ABOUT", "ABOUT_INTRO"),
    findContentBlocksBySection("ABOUT", "WORK_PROCESS"),
    findContentBlocksBySection("ABOUT", "OUTSIDE_ENGINEERING"),
    findPrinciplesBySection("about"),
  ]);

  return {
    aboutHeadline: mapAboutHeaderBlock(headerBlock),
    education: mapEducationBlock(educationBlock),
    aboutIntro: introBlocks.map(mapTextBlock),
    workProcess: workProcessBlocks.map(mapTextBlock),
    outsideEngineering: outsideEngineeringBlocks.map(
      mapOutsideEngineeringBlock,
    ),
    principles: principles.map(mapPrinciple),
  };
}
```

The corresponding page should remain presentation-focused:

```tsx
export default async function WorkPage() {
  const { featuredProjects, otherProjects } = await getWorkPageData();

  return (
    <>
      {/* Existing page structure and components */}
    </>
  );
}
```

## UI preservation

This milestone does not authorize a UI redesign.

The implementation may make small data-prop or page-facing type adjustments where the new loader output requires them, but it must preserve:

- existing page structure
- existing components where practical
- existing styling
- existing visible copy
- existing ordering
- existing metadata
- existing interactions
- existing responsive behaviour

Any broader visual, copy or component redesign is out of scope.

## Loading-state examples

Loading UI should be route-focused, presentation-only and free of database calls.

A suitable route structure could include:

```text
src/app/loading.tsx
src/app/work/loading.tsx
src/app/about/loading.tsx
```

```tsx
export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading portfolio content">
      <div className="animate-pulse">
        {/* Small route-specific skeleton using existing layout primitives */}
      </div>
    </main>
  );
}
```

The loading boundary must not introduce browser-side data fetching or make the route depend on client state.

## Error-state example

An `error.tsx` boundary is a client component because it receives `reset`, but it must only display a safe recovery state. It must not query the database or expose internal error details.

```tsx
"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main role="alert">
      <h1>Something went wrong.</h1>
      <p>The portfolio content could not be displayed.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
```

A database or required-content failure during `next build` must still fail the build. The error boundary is not a fallback for publishing an invalid deployment.

## Test-structure example

Tests should remain focused by module or responsibility rather than becoming one broad portfolio integration test.

```text
tests/portfolio/
├── content-block-identity.test.ts
├── content-block-schemas.test.ts
├── experience.mapper.test.ts
├── project.mapper.test.ts
├── project-links.schema.test.ts
├── home-page.loader.test.ts
├── work-page.loader.test.ts
└── about-page.loader.test.ts
```

The implementation may split the ContentBlock schema tests further when that improves clarity.

If the repository's established convention is `scripts/tests/`, preserve that location while maintaining equivalent separation.

## Constraints

- Use the existing Prisma schema, generated client and database connection established by the earlier milestones.
- Treat this milestone as a read-only database integration.
- Do not write to the database during page rendering or the production build.
- Follow the single-responsibility principle for queries, schemas, mappers and page loaders.
- Use one focused `content-blocks.query.ts` module rather than creating a file for every individual ContentBlock key or section.
- Prefer several small focused modules over one broad portfolio-data module.
- Keep pages responsible for presentation rather than database access, JSON parsing or transformation.
- Keep database access server-only and never expose `DATABASE_URL` or database credentials to browser code.
- Do not add an internal HTTP API for Server Components to access the database.
- Do not introduce controllers, dependency injection, domain layers or generic abstractions that the current scope does not need.
- Do not use client-side portfolio data fetching.
- Do not use React client state to hold database content.
- Loading and error components must remain presentation-focused and must not perform database queries.
- Loading UI must not change the routes from static rendering to request-time or client-side rendering.
- Error UI must not expose internal errors, stack traces, database details or secrets.
- Preserve the existing page structure, components, styling, metadata and user-visible content.
- Preserve the existing ordering represented by database `position` fields.
- Use existing component-facing content types where practical.
- Do not silently fall back to static content files.
- Keep Cache Components disabled for this milestone.
- Do not introduce `unstable_cache`.
- Preserve current application behaviour outside the portfolio data source.

## Explicitly out of scope

- Removing the static profile, experience or project files
- Changing the Milestone 2 seed workflow
- Schema or migration changes
- Reintroducing removed `Profile`, `Education` or `ContentItem` models
- Writing or editing portfolio content through the application
- An administration interface or CMS
- A visual redesign of `/`, `/work` or `/about`
- Broad component refactoring unrelated to the data-source change
- Time-based Incremental Static Regeneration
- On-demand route revalidation
- Supabase database webhooks
- Vercel deploy hooks
- Automatic deployments after database changes
- Migrating static metadata or Open Graph image content to database reads
- Changing navigation or external asset configuration
- Embedding generation
- `SiteChunk` changes
- Retrieval, RAG or assistant-response changes
- Unrelated application refactoring

Static content imports may remain outside `/`, `/work`, `/about` and their portfolio loaders where required by the explicitly excluded seed, RAG, metadata or Open Graph workflows.

## Required tests

1. Required ContentBlock lookup by stable key is covered.
2. Missing required ContentBlocks produce clear failures.
3. Required ContentBlock key, page and section mismatches produce clear failures.
4. Hero content parsing is covered for valid and malformed payloads.
5. Philosophy and current-direction content parsing are covered.
6. About-header and education content parsing are covered.
7. Repeatable text-block parsing is covered for about intro and work process payloads.
8. Outside-engineering content parsing is covered.
9. Ordered ContentBlock section retrieval is covered.
10. Experience mapping is covered in a focused test file.
11. Project mapping, including nullable fields and stack conversion, is covered in a focused test file.
12. Project-link JSON parsing is covered separately for valid and malformed values.
13. The home-page loader is tested for required home blocks, ordered services, home principles, featured projects and experiences.
14. The work-page loader is tested for project ordering and featured grouping.
15. The about-page loader is tested for header, education, about principles and each required ordered ContentBlock section.
16. Database query failures are surfaced without static-data fallback.
17. Loading components render meaningful route-specific placeholders.
18. Error boundaries display a safe recovery interface without exposing internal details.
19. Tests remain separated by module or responsibility rather than being placed in one broad portfolio-data test file.
20. The three public pages no longer import static profile, project or experience collections as their rendering source.
21. Prisma validation, Prisma Client generation, lint, typecheck and relevant existing tests remain green.

## Acceptance criteria

- [ ] Portfolio database queries are split into focused modules.
- [ ] `content-blocks.query.ts` contains focused key-based and section-based ContentBlock query functions.
- [ ] Database-to-UI mapping is separated from database querying.
- [ ] Unsafe JSON parsing is isolated in schema modules.
- [ ] ContentBlock schemas are nested under `schemas/content-blocks/` or an equivalent focused structure.
- [ ] Required singleton ContentBlocks are retrieved by stable key.
- [ ] Required singleton ContentBlocks are checked against their expected key, page and section.
- [ ] Repeatable ContentBlocks are queried by page and section and retain stored position order.
- [ ] Home, work and about each have a focused page loader.
- [ ] No single general-purpose module contains all portfolio queries, schemas, mappings and page composition.
- [ ] Each affected page renders from its corresponding server-side loader.
- [ ] The affected pages no longer directly import static profile, experience or project data as their rendering source.
- [ ] The page components do not fetch portfolio data from the browser or through an unnecessary internal API.
- [ ] Home and about loaders assemble typed page data from validated ContentBlocks.
- [ ] Required collections retain their stored ordering and section grouping.
- [ ] Project stacks, links, featured status and optional properties retain their existing UI meaning.
- [ ] Project links are validated before reaching UI components.
- [ ] Missing, mismatched, malformed or unavailable required content fails clearly.
- [ ] Static fallback data does not hide database failures.
- [ ] Meaningful loading UI exists for the affected routes.
- [ ] A safe error state exists for unexpected route-rendering failures.
- [ ] Loading and error handling do not introduce client-side data fetching.
- [ ] The routes remain configured for production-build static pre-rendering.
- [ ] Existing visible page structure, styling, content, metadata, interactions and responsive behaviour remain intact.
- [ ] Static source files remain available for seed and existing RAG workflows.
- [ ] Focused tests are separated according to responsibility.
- [ ] Explicitly excluded work was not introduced.
- [ ] Focused tests and repository validation commands pass.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

1. Complete the Milestone 2 manual seed verification against the intended local or hosted Supabase database.
2. Configure a server-only `DATABASE_URL` for the local production build and the intended Vercel Preview and Production environments.
3. Run `npm run build` against the seeded database.
4. Inspect the Next.js build summary and confirm `/`, `/work` and `/about` are reported as pre-rendered static routes.
5. Run the production build locally or deploy a Vercel Preview and inspect the rendered page source.
6. Change one harmless portfolio value in Supabase, trigger a new deployment and confirm the new deployment contains the updated value.

## Manual acceptance criteria

- [ ] The production build completes successfully using the seeded Supabase database.
- [ ] `/`, `/work` and `/about` are reported as pre-rendered static routes.
- [ ] The complete portfolio content is visible in the initial HTML source without waiting for a browser-side request.
- [ ] The database-backed pages visually match the current site structure and ordering.
- [ ] The deployed site does not expose `DATABASE_URL` or other database credentials to the browser.
- [ ] A database content change becomes visible after a new deployment.
