# Milestone 1: Supabase Database Foundation

**Status:** Frozen
**Version:** 1.0.0  
**Last Updated:** 2026-07-17  
**Depends On:** none  
**Target Pull Request:** —  
**Target Branch:** —  
**Superseded By:** —

## Goal

Create a Supabase-backed database foundation for the site's current static content, with Prisma integration and version-controlled migrations that can be applied consistently to local and hosted Supabase environments.

## Required behaviour

- Inspect the current static data and design an appropriate relational schema around it.
- Configure Prisma for the existing Supabase PostgreSQL database and generate a reusable Prisma Client.
- Add the database schema and initial migrations to version control using a clear, maintainable source of truth.
- Ensure the migrations can be applied to both local Supabase and a hosted Supabase project without changing application behaviour.
- Document the commands and environment requirements for generating the Prisma Client, creating migrations and applying migrations locally and to a hosted project.

## Constraints

- Preserve the current static data and existing site behaviour during this milestone.
- Keep database and migration assets in the repository's established Supabase and Prisma locations.
- Avoid conflicting or duplicated migration histories between Prisma and Supabase.
- Do not commit credentials, generated secrets or environment files.
- Implement the smallest complete database foundation needed for the current data.

## Explicitly out of scope

- Seeding the current static data into Supabase
- Reading or rendering site content from Supabase
- Embedding generation or storage changes
- Retrieval, RAG or assistant-response changes
- Removing the existing `site_chunks` flow
- Deployment automation or GitHub Actions for migrations
- Unrelated refactoring or future data features

## Required tests

1. The Prisma schema validates and Prisma Client generation succeeds.
2. The initial migration applies successfully to a clean local Supabase database.
3. Reapplying the deployment workflow does not create unintended schema drift or duplicate migrations.
4. Existing lint, typecheck and build commands remain green.

## Acceptance criteria

- [ ] The current static content has been represented by an appropriate relational database schema.
- [ ] Prisma is configured for Supabase PostgreSQL and Prisma Client generation succeeds.
- [ ] The initial database migration is committed and can initialise a clean local Supabase database.
- [ ] The documented deployment process can apply the same migration history to a hosted Supabase project.
- [ ] A single clear migration source of truth is maintained without Prisma and Supabase drift.
- [ ] Existing site behaviour remains unchanged and static content remains in use.
- [ ] Local and hosted migration commands and required environment configuration are documented.
- [ ] Explicitly excluded work was not introduced.
- [ ] Focused tests and repository validation commands pass.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual verification

1. Follow the documented setup from a clean checkout, apply the initial migration to local Supabase, generate Prisma Client and confirm the expected tables and relationships exist without changing the rendered site.
2. Verify that the documented hosted deployment command targets the configured Supabase project without requiring source-code changes or committed credentials.
