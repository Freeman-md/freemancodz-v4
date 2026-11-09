# Freeman Madudili portfolio

This Next.js App Router site reads the portfolio from PostgreSQL through Prisma. The assistant can handle general conversation and the existing contact, audit, and meeting workflows. It directs portfolio questions to Work while portfolio answers are unavailable.

See the [portfolio operations guide](docs/portfolio-content-system.md) for the five editable inputs, seed commands, and staged release procedure. See [Workflow Foundation](docs/workflow-foundation.md) for durable workflow instances and confirmation rules.

## Local development

Install dependencies with `npm ci`. Set the server variables described in `.env.example`, then run `npm run dev` against a migrated and seeded local database. Next.js reads PostgreSQL at request time. A production build requires no database connection.

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
