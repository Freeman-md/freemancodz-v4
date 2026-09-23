# Milestone 2: Seed Portfolio Data

**Status:** Frozen
**Version:** 1.0.0  
**Last Updated:** 2026-07-17  
**Depends On:** Milestone 1  
**Target Pull Request:** —  
**Target Branch:** —  
**Superseded By:** —

## Goal

Create a repeatable seed workflow that writes the site's current static portfolio content into the Supabase database through Prisma without changing how the site currently renders.

## Required behaviour

- Inspect the current static profile, experience and project data and map it to the existing Prisma models.
- Add a seed script that writes the current data into the corresponding database tables.
- Make the seed process safe to run again without creating duplicate portfolio records.
- Preserve the current ordering and all values represented by the static data, including project stacks and links.
- Add a repository command for running the seed and document the required environment configuration and local or hosted usage.
- Report clear failures when the database connection or seed operation is unsuccessful.

## Constraints

- Use the existing Prisma client and the schema established in Milestone 1.
- Keep the static files as the source data for this milestone.
- Preserve the current site behaviour and continue rendering from static data.
- Do not commit database credentials, environment files or generated secrets.
- Implement the smallest complete and maintainable seed workflow.

## Explicitly out of scope

- Reading or rendering site content from Supabase
- Removing or changing the current static data files
- Seeding or redesigning `SiteChunk`
- Embedding generation or storage changes
- Retrieval, RAG or assistant-response changes
- Automatic seeding during deployment
- Unrelated schema changes or application refactoring

## Required tests

1. The seed mapping covers the current profile, education, principles, services, content items, experiences and projects.
2. Re-running the seed does not create duplicate records and results in the same stored portfolio content.
3. Seed failures return a non-zero exit status and release database resources cleanly.
4. Prisma validation, Prisma Client generation, lint and typecheck remain green.

## Acceptance criteria

- [ ] A repository seed script maps all current static portfolio data to the existing Prisma models.
- [ ] The seed operation is repeatable without creating duplicate portfolio records.
- [ ] Ordering and structured project values are preserved.
- [ ] A documented repository command runs the seed against the configured database.
- [ ] Connection and write failures are surfaced clearly.
- [ ] Existing static site behaviour remains unchanged.
- [ ] Explicitly excluded work was not introduced.
- [ ] Focused tests and repository validation commands pass.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

1. Set `DATABASE_URL` to the intended local or hosted Supabase PostgreSQL database and run the documented seed command.
2. Inspect the target Supabase database after the command completes.

## Manual acceptance criteria

- [ ] The seed command completes successfully against the intended Supabase database.
- [ ] The stored profile, education, principles, services, content items, experiences and projects match the current static site data without duplicates.
