# Milestone 3 Amendment 1: Replace Imperative Content Validation with Zod Schemas

**Status:** Frozen  
**Version:** 1.0.0  
**Last Updated:** 2026-07-17  
**Amends:** Milestone 3  
**Target Pull Request:** #4  
**Target Branch:** `feat/milestone-3-prerender-portfolio-data`  
**Supersedes for active implementation:** the schema-validation portions of Milestone 3

## Context

Milestone 3 introduced files under `src/features/portfolio/schemas/`, but the current pull request implements the ContentBlock validation through imperative helper functions such as `parseObject` and `readString`.

That implementation validates data, but it does not match the intended architecture. Files named `*.schema.ts` inside a `schemas/` directory must contain declarative Zod schemas rather than hand-written JavaScript type checks.

This amendment is the active contract for correcting that boundary. The rest of Milestone 3 remains unchanged.

## Goal

Replace the current imperative ContentBlock and project-link validation with readable, declarative Zod schemas, and validate Prisma JSON values through those schemas before the data reaches mappers, loaders or page components.

This amendment does not change the database schema, seeded content, route behaviour, UI, page structure or rendering strategy.

## Required behaviour

- Add `zod` as a production dependency if it is not already installed.
- Keep schema files under `src/features/portfolio/schemas/`.
- Keep ContentBlock schemas nested under `src/features/portfolio/schemas/content-blocks/`.
- Each `*.schema.ts` file must export an actual Zod schema.
- Use `z.object`, `z.string`, `z.array`, `z.url` or equivalent Zod primitives appropriate to the stored shape.
- Infer TypeScript types from the schemas with `z.infer` where practical instead of maintaining duplicate handwritten content types.
- Validate every Prisma `Json` boundary with `.parse` or `.safeParse` before exposing the value to mapping or presentation code.
- Preserve clear errors that identify the affected ContentBlock key or project title.
- Keep schema declarations declarative and free of hand-written field-reading helpers.
- Remove the current imperative `parseObject` and `readString` validation approach.
- Remove `shared.ts` if it becomes unused after the Zod conversion.
- Keep orchestration, error-context wrapping and database identity checks outside the schema declarations.
- Preserve all existing Milestone 3 page loader, static pre-rendering, error-boundary and UI-preservation requirements.

## Required schemas

The implementation must provide declarative Zod schemas for the current JSON payloads:

```text
src/features/portfolio/schemas/
├── content-blocks/
│   ├── hero.schema.ts
│   ├── philosophy.schema.ts
│   ├── current-direction.schema.ts
│   ├── about-header.schema.ts
│   ├── education.schema.ts
│   ├── text-block.schema.ts
│   └── outside-engineering.schema.ts
└── project-links.schema.ts
```

The exact exported names may follow repository conventions, but the intent should be obvious. Suitable examples include:

```ts
import { z } from "zod";

export const heroContentSchema = z.object({
  name: z.string(),
  headline: z.string(),
  intro: z.string(),
  heroNote: z.string(),
});

export type HeroContent = z.infer<typeof heroContentSchema>;
```

```ts
import { z } from "zod";

export const projectLinkSchema = z.object({
  label: z.string(),
  href: z.string().url(),
});

export const projectLinksSchema = z.array(projectLinkSchema);
```

Schema declarations must describe the accepted data shape. They must not manually inspect records field by field through custom `typeof` checks.

## Parsing and error context

Schemas define valid shapes. Small parsing functions may exist outside the schema declaration when they add domain-specific context to errors.

For example:

```ts
export function parseContentBlock<T>(
  schema: ZodType<T>,
  value: unknown,
  key: string,
): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new Error(`Invalid content stored for block: ${key}`, {
      cause: result.error,
    });
  }

  return result.data;
}
```

Such a function belongs in a focused parser, mapper or boundary module, not inside every `*.schema.ts` file.

The existing checks that confirm a required ContentBlock has the expected `key`, `page` and `section` remain required. Zod payload validation does not replace those database identity checks.

## Current PR corrections

Review and update the current Milestone 3 pull request, especially:

- `src/features/portfolio/schemas/content-blocks/shared.ts`
- every file under `src/features/portfolio/schemas/content-blocks/*.schema.ts`
- `src/features/portfolio/schemas/project-links.schema.ts`
- ContentBlock mapper or parser call sites
- project-link mapper or parser call sites
- ContentBlock schema tests
- project-link schema tests
- `package.json` and the lockfile

Do not rewrite unrelated Milestone 3 implementation that already satisfies the frozen contract.

## Constraints

- Do not change the Prisma schema or create a database migration.
- Do not change the seeded ContentBlock payloads merely to simplify validation.
- Do not change the public UI or component structure.
- Do not introduce client-side validation for server-loaded portfolio data.
- Do not place Prisma queries inside schema files.
- Do not place page-loader composition inside schema files.
- Do not turn schemas into classes, repositories or generic framework abstractions.
- Do not keep parallel handwritten interfaces that can safely be inferred from the Zod schemas without a clear reason.
- Do not silently coerce malformed database values unless the frozen Milestone 3 contract explicitly requires that behaviour.
- Do not silently fall back to static content when validation fails.

## Required tests

1. Each ContentBlock schema accepts its valid seeded payload shape.
2. Each ContentBlock schema rejects missing required fields.
3. Each ContentBlock schema rejects fields with incorrect types.
4. Repeatable text-block and outside-engineering schemas reject malformed payloads.
5. Project-link schemas accept valid link arrays and reject malformed entries.
6. Parsing failures include the affected ContentBlock key or project title at the application boundary.
7. Existing key, page and section identity tests remain green.
8. Existing home, work and about loader tests remain green.
9. Existing route-state, mapper, Prisma, lint and typecheck checks remain green.

## Acceptance criteria

- [ ] `zod` is present as a runtime dependency.
- [ ] Every file named `*.schema.ts` in the portfolio feature exports an actual Zod schema.
- [ ] ContentBlock payload types are inferred from Zod schemas where practical.
- [ ] Project-link types are inferred from Zod schemas where practical.
- [ ] No schema file uses the current `parseObject` or `readString` approach.
- [ ] The obsolete shared imperative validation helpers are removed when no longer used.
- [ ] All Prisma JSON values are parsed through the appropriate Zod schema before reaching UI-facing data.
- [ ] Validation errors retain useful ContentBlock-key or project-title context.
- [ ] ContentBlock key, page and section identity checks remain intact.
- [ ] No database, seed, route, rendering or visual behaviour changes are introduced.
- [ ] Focused schema and boundary tests pass.
- [ ] The existing Milestone 3 validation commands pass.
- [ ] The PR remains unmerged until independent review is complete.

## Suggested validation commands

```bash
npm install
npm run test:portfolio
npm run lint
npm run typecheck
npm run prisma:validate
npm run prisma:generate
```

Run the existing production-build verification from Milestone 3 against the intended seeded database after the amendment implementation is complete.
