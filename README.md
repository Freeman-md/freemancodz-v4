# Freeman Madudili portfolio

This Next.js App Router site reads the portfolio from PostgreSQL through Prisma. The assistant can handle general conversation and the existing contact and meeting workflows. It answers portfolio questions from indexed published records and links to the related portfolio pages.

See the [portfolio operations guide](docs/portfolio-content-system.md) for the five editable inputs, seed commands, and staged release procedure. See [Workflow Foundation](docs/workflow-foundation.md) for durable workflow instances and confirmation rules.

## Local development

Install dependencies with `npm ci`. Set the server variables described in `.env.example`, then run `npm run dev` against a migrated and seeded local database. Development reads the seeded database. Production builds prerender the portfolio from PostgreSQL. Published portfolio pages serve the built content even when the database is unavailable. Chat and its workflows still use the database at runtime.

To start over on local Supabase, confirm Prisma shows `127.0.0.1:54332` before accepting the reset prompt. Reset deletes local data; the seed restores the portfolio content.

```bash
npx prisma migrate reset && npm run portfolio:seed:local -- --apply
npm run portfolio:index
```

For a new empty database, use `npm run prisma:migrate` in place of the reset.

Prisma migrations under `prisma/migrations` are the schema history. Additive migration, seeding, deployment, and legacy cleanup are separate operations. Follow the staged release procedure before upgrading an existing database.

## Verification

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run build
```

Run `npm run test:portfolio:database` with `PORTFOLIO_TEST_DATABASE_URL` set to a disposable PostgreSQL server with pgvector available. The suite creates temporary databases and fails if the test connection is missing. Use the same isolated server when running `npm test` to also exercise the existing workflow, meeting, request and rate-limit database suites.

The browser journeys in `tests/e2e/homepage.mjs` and `tests/e2e/work.mjs` use a seeded production build with intercepted chat traffic. `HOMEPAGE_URL` can point them at a different base URL. Provide Playwright with Chromium and WebKit installed.
