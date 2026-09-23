# Milestone 1 Amendment 1: Simplify Portfolio Schema

**Status:** Frozen  
**Version:** 1.0.0  
**Last Updated:** 2026-07-17  
**Parent Milestone:** `.ai/milestones/milestone-1.md`  
**Target Pull Request:** `#2`  
**Target Branch:** `codex/feat/milestone-1-database-foundation`  
**Cycle Scope:** `milestone-1-amendment-1`  
**Maximum Amendment Cycles:** `3`

## Reason

The initial schema models the portfolio as though it could contain multiple profiles and normalises simple project metadata into separate relational tables. This site represents one portfolio only, so those relationships and tables add unnecessary complexity.

## Changed requirements

- Rename `PortfolioProfile` to `Profile` and rename the related profile-prefixed models to `Education`, `Principle`, `Service` and `ContentItem`.
- Treat `Profile`, `Education`, `Principle`, `Service` and `ContentItem` as standalone content models.
- Remove `profileId` fields, profile relations and profile-based indexes or unique constraints from `Education`, `Principle`, `Service` and `ContentItem`.
- Remove the education, principles, services and content-item relations from `Profile`.
- Preserve ordering constraints where required without depending on a profile identifier.
- Replace `ProjectStack` with a string-array field on `Project`.
- Replace `ProjectLink` with a JSON field on `Project` that stores the existing link label and href values.
- Remove the `ProjectStack` and `ProjectLink` models and their project relations.
- Update the Supabase migration so a clean application produces the simplified schema without retaining obsolete profile relationship columns or project metadata tables.
- Keep `SiteChunk`, `Experience` and all unaffected fields unchanged.

## Behaviour that must not change

- Existing static site rendering and runtime behaviour must remain unchanged.
- The schema must continue to represent all data currently stored in the static profile, experience and project files.
- Prisma Client generation and the documented local and hosted Supabase migration workflows must continue to work.
- The parent milestone's single migration source-of-truth requirement must remain intact.

## Explicitly out of scope

- Seeding data into Supabase
- Reading or rendering content from Supabase
- Embedding, retrieval or assistant changes
- Removing or redesigning `SiteChunk`
- Adding multi-profile support
- Deployment automation
- Unrelated schema or application refactoring

## Required tests

1. Prisma schema validation and Prisma Client generation succeed with the simplified models.
2. The revised migration applies successfully to a clean local Supabase database and creates the expected standalone tables and project fields.
3. The resulting database contains no profile foreign keys, profile relationship constraints, `project_stacks` table or `project_links` table.
4. Existing lint, typecheck and relevant repository validation commands remain green.

## Acceptance criteria

- [ ] Profile-related models use the simplified standalone names.
- [ ] Profile foreign keys, relations and profile-based constraints are removed.
- [ ] Project stacks are stored as a string array on `Project`.
- [ ] Project links are stored as JSON on `Project` and preserve label and href values.
- [ ] Obsolete project stack and link models and tables are removed.
- [ ] The migration history produces the revised schema cleanly without duplication or drift.
- [ ] Unchanged parent milestone requirements still hold.
- [ ] No unrelated work was introduced.
- [ ] Validation passes.
- [ ] The independent review covers the parent milestone and amendment.
- [ ] The pull request is not merged by an agent.
