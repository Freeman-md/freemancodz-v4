# Milestone 3: Pre-render Portfolio Data from Supabase

**Status:** Draft  
**Version:** 1.0.0  
**Last Updated:** 2026-07-17  
**Depends On:** Milestone 2  
**Target Pull Request:** —  
**Target Branch:** —  
**Superseded By:** —

## Goal

Replace the public portfolio pages' static rendering source with server-only Prisma reads from the seeded Supabase database, while ensuring the home, work and about pages are pre-rendered into complete static HTML during the production build.

## Required behaviour

- Add a small server-only portfolio feature that reads the seeded portfolio data through the existing Prisma client.
- Separate database queries, database-to-UI mapping, unsafe-value validation and page-level data composition into focused modules.
- Ensure each function and module has one clear responsibility.
- Add separate page loaders for the home, work and about pages.
- Keep raw Prisma queries outside page components.
- Keep database record transformation outside page components.
- Avoid placing all portfolio queries, mappings, validation and page composition in one general-purpose file.
- Fetch only the records required by each page.
- Run independent page queries concurrently where practical.
- Read and validate the single profile and education records required by the portfolio.
- Fail clearly when the database contains no profile or education record, or contains an ambiguous number of either record.
- Fetch services, principles, content items, experiences and projects in their stored `position` order.
- Group principles and content items according to their stored section values.
- Preserve the current featured and non-featured project grouping.
- Validate project-link JSON at the database boundary.
- Report a clear error identifying the affected project when stored project links are malformed.
- Map database records into the existing component-facing profile, project and experience shapes.
- Convert database null values into the existing optional UI properties without changing rendered behaviour.
- Update `/`, `/work` and `/about` to use their respective server-side page loaders.
- Ensure `/`, `/work` and `/about` remain Server Components and are pre-rendered during the production build.
- Ensure the rendered HTML contains the portfolio content without requiring client-side data fetching, hydration-time fetching or a loading-time database request.
- Add meaningful loading UI for the affected route segments.
- Add a user-safe error boundary for unexpected route-rendering failures.
- Fail the production build clearly when required database content cannot be loaded or validated.
- Keep the existing static content files available for the seed and existing RAG workflows, but stop importing them as the rendering source of `/`, `/work` and `/about`.
- Document the database environment requirements and production-build verification process.

## Constraints

- Use the existing Prisma schema, generated client and database connection established by the earlier milestones.
- Treat this milestone as a read-only database integration.
- Do not write to the database during page rendering or the production build.
- Follow the single-responsibility principle for queries, mappers, validators and page loaders.
- Prefer several small focused modules over one broad portfolio-data module.
- Keep pages responsible for presentation rather than database access or transformation.
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
- Use the existing component-facing content types where practical.
- Do not silently fall back to the static content files.
- Keep Cache Components disabled for this milestone.
- Do not introduce `unstable_cache`.
- Preserve current application behaviour outside the portfolio data source.

## Explicitly out of scope

- Removing the static profile, experience or project files
- Changing the Milestone 2 seed workflow
- Schema or migration changes
- Writing or editing portfolio content through the application
- An administration interface or CMS
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

## Required tests

1. Profile mapping is covered in a focused test file.
2. Experience mapping is covered in a focused test file.
3. Project mapping, including nullable fields and stack conversion, is covered in a focused test file.
4. Project-link JSON validation is covered separately for valid and malformed values.
5. The home-page loader is tested for ordered services, home principles, featured projects and experiences.
6. The work-page loader is tested for project ordering and featured grouping.
7. The about-page loader is tested for education, about principles and each required content section.
8. Missing or ambiguous profile and education records produce clear failures.
9. Database query failures are surfaced without static-data fallback.
10. Loading components render meaningful route-specific placeholders.
11. Error boundaries display a safe recovery interface without exposing internal details.
12. Tests remain separated by module or responsibility rather than being placed in one broad portfolio-data test file.
13. The three public pages no longer import static profile, project or experience collections as their rendering source.
14. Existing seed tests, Prisma validation, Prisma Client generation, lint and typecheck remain green.

## Acceptance criteria

- [ ] Portfolio database queries are split into focused modules.
- [ ] Database-to-UI mapping is separated from database querying.
- [ ] Unsafe JSON validation is isolated at the relevant boundary.
- [ ] Home, work and about each have a focused page loader.
- [ ] No single general-purpose module contains all portfolio queries, mappings, validation and page composition.
- [ ] Each affected page renders from its corresponding server-side loader.
- [ ] The affected pages no longer directly import static profile, experience or project data as their rendering source.
- [ ] The page components do not fetch portfolio data from the browser or through an unnecessary internal API.
- [ ] Required collections retain their stored ordering and section grouping.
- [ ] Project stacks, links, featured status and optional properties retain their existing UI meaning.
- [ ] Project links are validated before reaching UI components.
- [ ] Missing, ambiguous, malformed or unavailable required content fails clearly.
- [ ] Static fallback data does not hide database failures.
- [ ] Meaningful loading UI exists for the affected routes.
- [ ] A safe error state exists for unexpected route-rendering failures.
- [ ] Loading and error handling do not introduce client-side data fetching.
- [ ] The routes remain configured for production-build static pre-rendering.
- [ ] Existing visible page structure and behaviour remain intact.
- [ ] Static source files remain available for seed and existing RAG workflows.
- [ ] Focused tests are separated according to responsibility.
- [ ] Explicitly excluded work was not introduced.
- [ ] Focused tests and repository validation commands pass.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

1. Complete the Milestone 2 manual seed verification against the intended Supabase database.
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
