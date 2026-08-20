# Milestone 17: Database-Driven Assistant Search Indexing

**Status:** Frozen
**Version:** 1.0.0
**Last Updated:** 2026-08-18
**Depends On:** Milestone 16
**Target Pull Request:** —
**Target Branch:** `feat/milestone-17-database-driven-search-indexing`
**Superseded By:** —

## Goal

Replace the disabled, source-specific legacy indexer with one small database-driven workflow for the current portfolio domain:

```text
Portfolio database mutation
→ PostgreSQL statement trigger
→ one coalesced portfolio rebuild job
→ daily or manually invoked one-shot worker
→ current portfolio snapshot mapped, chunked and embedded
→ site_chunks atomically replaced
→ existing assistant retrieval searches the new snapshot
```

At completion:

1. every committed create, update or delete affecting current portfolio content requests indexing inside PostgreSQL, regardless of which application or tool performed the write;
2. the admin, seed/bootstrap workflow and other writers remain unaware of indexing;
3. repeated changes coalesce into one durable singleton rebuild job;
4. one bounded worker attempt rebuilds the complete small portfolio snapshot and never performs OpenAI work inside a database transaction;
5. the previous searchable snapshot remains available unless and until a complete replacement succeeds;
6. failed work is observable, retryable up to three attempts and recoverable through a later content mutation or explicit rebuild;
7. production continues using the existing daily Vercel cron;
8. normal developer operation is reduced to four clear manual commands; and
9. the assistant's existing query embedding, `match_site_chunks` retrieval and tool behaviour remain compatible.

The design intentionally rebuilds the complete portfolio rather than attempting incremental dependency tracking. At this portfolio's scale, a little repeated embedding work is a better trade-off than source tombstones, relationship fan-out rules, application hooks or another event system.

---

## Dependency state and start gate

Milestone 16 PR [#17](https://github.com/Freeman-md/freemancodz-v4/pull/17) is merged. Its contract is archived as part of activating this milestone.

Before implementation begins, the orchestrator must:

- fetch and prune the remote;
- verify PR #17 remains merged;
- verify the local default branch can be fast-forwarded to the remote default branch without losing uncommitted work;
- complete the repository's post-merge branch cleanup where it remains outstanding;
- start the Milestone 17 branch from the exact latest remote default-branch head;
- verify no earlier milestone pull request remains open or unmerged;
- confirm this is the only relevant `Active` milestone; and
- freeze this contract before writing implementation code.

Do not reuse a deleted Milestone 16 feature branch, create a duplicate pull request, or implement directly on a stale local default branch.

---

## Source of truth

Read and enforce, in order:

1. `AGENTS.md`;
2. `.agents/skills/nextjs-architecture/SKILL.md`;
3. `.agents/skills/supabase/SKILL.md`;
4. `.agents/skills/supabase-postgres-best-practices/SKILL.md` and the specific PostgreSQL rules relevant to triggers, constraints, transactions, concurrency, indexes and security;
5. `.ai/README.md`, `.ai/prompts/**` and `.ai/workflow/**`;
6. this milestone contract;
7. the final merged Milestone 15 and 16 implementation on the default branch; and
8. current repository, installed-package and bundled-framework evidence.

The local analysis notes under `docs/indexing/` informed this contract, but they are intentionally ignored working documents. This contract is self-contained. Do not unignore, commit or depend on those notes to implement or review the milestone.

Prisma migrations remain the only schema migration source of truth for this application. Do not create a second Supabase migration history for the same change.

---

## Verified starting point

The implementation begins from these repository facts, which must be rechecked on the final branch head before editing:

- `SiteChunk`, its 1,536-dimension pgvector column, HNSW index and `match_site_chunks()` already provide assistant retrieval;
- `SiteSearchService` and the assistant search tool already use that retrieval path and must remain behaviourally compatible;
- the shared OpenAI provider already provides embeddings for assistant queries and can be reused for indexing;
- `SearchIndexJob` still models legacy per-source `upsert`/`delete` work;
- the original indexing migration created row-level triggers for obsolete `content_blocks`, `projects`, `services`, `principles` and `experiences` source records;
- the Milestone 15 portfolio migration dropped those triggers while deliberately preserving `site_chunks`, `search_index_jobs` and retrieval;
- current legacy source loading/mapping fails closed, and known legacy jobs cannot be claimed;
- current portfolio writes therefore do not refresh the assistant index;
- the search-index module still exposes obsolete source, preview, status, polling-worker and clean rebuild responsibilities;
- the scheduled route already runs daily at `0 8 * * *` through Vercel Cron;
- current worker configuration accepts an unnecessary `SEARCH_INDEX_WORKER_SECRET` fallback and configurable batch limit; and
- the current portfolio public surface provides Home, Work, About and Audit page services with assembled Profile, recursive ContentBlock, Project and Experience data.

Do not preserve disabled legacy behaviour as compatibility architecture.

---

## Approved architecture

These decisions are final for this milestone. A real contradiction discovered in the merged code must be escalated rather than silently replaced with a more elaborate design.

### 1. PostgreSQL owns change detection

Attach the same lightweight `AFTER INSERT OR UPDATE OR DELETE FOR EACH STATEMENT` trigger function to all thirteen current portfolio tables whose content or relationships affect the public portfolio:

```text
profiles
content_blocks
icon_blocks
media_blocks
action_blocks
content_block_icon_blocks
content_block_media_blocks
content_block_action_blocks
content_block_children
profile_icon_blocks
experiences
experience_icon_blocks
projects
```

The function performs only a small queue-state upsert. It must not:

- call OpenAI or another HTTP service;
- build documents or embeddings;
- inspect application cache state;
- contain portfolio presentation/mapping logic; or
- depend on the admin or any application hook.

Use statement-level triggers because one SQL statement represents one request to rebuild the complete portfolio. Do not create a job per changed row.

Do not attach indexing triggers to `search_index_jobs`, `site_chunks`, `meetings` or any unrelated table.

Transaction semantics must remain native: a rolled-back portfolio mutation must not leave a committed indexing request.

### 2. One singleton job, not an event history

Replace the incompatible legacy `search_index_jobs` operational table with a singleton current-state table represented by the Prisma `SearchIndexJob` model.

Required logical fields:

```text
job_key          text primary key, constrained to "portfolio"
status           pending | processing | completed | failed
rerun_requested  boolean
attempts          non-negative integer
available_at      timestamptz
requested_at      timestamptz
claimed_at        nullable timestamptz
processed_at      nullable timestamptz
last_error        nullable text
```

Use database constraints for the singleton key, valid statuses and non-negative attempts. Do not add source type, source ID, operation, worker ID, event payload or a growing history table.

The primary key is the coalescing boundary. A pending-job partial index, source index and batch index are unnecessary for one row.

### 3. Queue transition semantics

The trigger function and repository must preserve these outcomes:

| Current state | New committed portfolio mutation |
| --- | --- |
| no row | insert `portfolio` as immediately available `pending` work |
| `pending` | keep one immediately available `pending` row and coalesce the request |
| `completed` or `failed` | start fresh `pending` work, reset attempts, clear terminal error state |
| `processing` | keep `processing`, set `rerun_requested = true`, and update `requested_at` |

An explicit rebuild request uses the same state transition; it does not implement a separate queue or indexing algorithm.

Claiming must be one atomic conditional state change so concurrent workers cannot both claim the singleton. A conditional `UPDATE ... WHERE status = 'pending' AND available_at <= now() RETURNING ...` is sufficient. Do not add `SKIP LOCKED`, worker leases or distributed coordination unless repository evidence proves the singleton update cannot satisfy the requirement.

The worker counts an attempt when work is claimed. Maximum attempts are fixed at **three**.

Failure settlement must:

- preserve the existing searchable chunks;
- store only a short sanitised error summary;
- requeue immediately when the attempt count is below three;
- become terminal `failed` at the third failed attempt; and
- if a newer mutation set `rerun_requested` during the failed attempt, preserve that newer work by returning to fresh pending state instead of losing it to the older failure.

A later portfolio mutation or explicit rebuild must recover a terminal failed row by resetting it to fresh pending work.

Completion must:

- become `completed` when no newer request arrived; or
- become immediately available `pending` work when `rerun_requested` was set while processing.

Recover a `processing` claim whose `claimed_at` is older than ten minutes. Recovery still obeys the three-attempt limit; it must not make abandoned work retry forever.

The worker processes at most one claim and exits. It must not poll, sleep or loop continuously.

### 4. Queue security

The new public-schema queue table is internal operational state:

- enable Row Level Security;
- revoke table access from `public`, `anon` and `authenticated`;
- use an ordinary invoker trigger function with fully qualified object names;
- do not mark it `SECURITY DEFINER` merely to bypass privileges; and
- revoke direct function execution from `public`, `anon` and `authenticated`.

The database role used by Prisma must retain the access needed by the repositories and migrations. Do not expose the queue as a public Supabase Data API/RPC surface.

### 5. Forward migration and preserved retrieval

Create one new forward Prisma migration that:

1. defensively drops every obsolete legacy indexing trigger if present;
2. drops the orphaned legacy `public.enqueue_search_index_job()` function;
3. replaces the legacy job table because it contains derived operational state, not business data;
4. creates the constrained and secured singleton table;
5. creates the enqueue function;
6. installs statement-level triggers on all thirteen tables; and
7. inserts the initial pending `portfolio` job after trigger installation.

Do not edit, delete or squash historical migrations. The complete historical chain must still apply cleanly to an empty PostgreSQL database.

Do not truncate or rewrite `site_chunks` in the migration. Existing assistant retrieval remains available until the new worker successfully replaces it.

Keep the existing `SiteChunk` table, vector dimension, HNSW index and `match_site_chunks()` function unless a narrow compatibility correction is proven necessary. A new embedding model or vector dimension is outside this milestone.

### 6. Full current portfolio snapshot

The indexer must use the portfolio module's configured public page-service interfaces rather than importing its repositories, Prisma client or internal models across the module boundary.

The search-index composition may group the existing configured Home, Work, About and Audit services in one plain dependency object. Do not create another service/provider/interface pair merely to group four dependencies.

Load one coherent current snapshot from:

- Home page data;
- Work page data;
- About page data; and
- Audit page data.

Map it using these identity and deduplication rules:

- take the singleton Profile once;
- deduplicate top-level ContentBlock trees by database ID across all pages;
- recursively include ordered child ContentBlocks and their ordered IconBlock, MediaBlock and ActionBlock meaning in their owning top-level document;
- take all Projects from Work and deduplicate any other Project appearances by ID;
- take all Experiences from About and deduplicate by ID;
- index each Project and Experience exactly once even when a page reuses it; and
- produce stable source identities:

```text
profile:global
content_block:<uuid>
project:<uuid>
experience:<uuid>
```

The mapper must be pure and use an explicit allowlist of publicly meaningful fields. Include useful human-readable content such as titles, labels, copy, project problem/solution/outcome/markdown, experience narrative, dates/roles, media alt text and action intent where present.

Exclude:

- storage/media source URLs as content;
- internal timestamps;
- arbitrary object serialisation;
- secret or admin-only data;
- raw provider payloads; and
- database IDs from prose, except where required for stable internal provenance.

Document URLs stored in `site_chunks` must be valid public site routes or anchors appropriate to the source, not storage URLs or admin routes.

The complete snapshot must contain at least one valid document and one prepared chunk. An unexpectedly empty snapshot is a failure and must not erase the working index.

### 7. Deterministic chunking and embeddings

Keep and adapt the existing deterministic text chunker and content hashes. Stable chunk IDs and hashes remain useful provenance and a future optimisation seam.

For this milestone, embed the complete prepared snapshot on every successful rebuild attempt. Do not add incremental embedding reuse, cross-run caching or dependency-aware partial indexing.

Before replacing database rows, validate:

- every document maps to valid metadata;
- at least one chunk exists;
- the number of embeddings matches the number of prepared chunks;
- every embedding uses the configured model metadata; and
- every embedding has exactly 1,536 numeric values.

OpenAI calls and all document/chunk preparation must finish before the replacement database transaction begins.

### 8. Atomic snapshot replacement

Replace per-source delete/insert operations with one portfolio snapshot repository operation, equivalent to:

```ts
replacePortfolioSnapshot(chunks: EmbeddedSiteChunk[]): Promise<void>;
```

At current scope, `site_chunks` is exclusively the portfolio assistant knowledge store. After all embeddings have been prepared and validated, one short transaction must:

1. delete all existing `site_chunks`, including preserved legacy source types; and
2. insert the complete new snapshot.

If deletion, insertion or commit fails, the transaction must roll back so retrieval sees the previous complete snapshot. It must never expose a deliberately emptied or partially written index.

Straightforward batched inserts are acceptable if needed by query limits, but do not create a generic bulk-write framework.

### 9. Search-index module surface and composition

Keep `SiteSearchService` as the separate assistant read capability.

Reduce the configured write/index service's public behavioural surface to:

```ts
processPendingJob(): Promise<IndexWorkerResult>;
requestRebuild(): Promise<void>;
```

Exact result naming may follow repository conventions, but the result must be a small validated union that distinguishes at least:

- processed work with safe document/chunk counters and final state; and
- skipped execution when no claim was available.

The service flow is:

```text
claim once
→ if absent, return skipped
→ load public portfolio snapshot
→ map and deterministically chunk
→ embed the complete prepared snapshot
→ atomically replace site_chunks
→ complete or requeue based on rerun_requested
```

On failure, settle the claimed job safely, emit structured backend logs and throw/return only the application-level failure required by the adapter. Do not expose raw Prisma, PostgreSQL or OpenAI errors.

Keep the separated composition architecture. `search-index.composition.ts` should assemble only the dependencies needed for:

- the job repository;
- the chunk repository;
- the shared OpenAI provider;
- the shared backend logger;
- grouped public portfolio page services;
- `SearchIndexService`; and
- `SiteSearchService`.

The root composition surface continues to expose only intentional configured services. Repositories and internal mappers must not become application-facing.

The search-index module may import portfolio capabilities only through `src/server/modules/portfolio/public.ts`. If an existing page-service type is missing from that deliberate public surface, add the narrow export there rather than reaching into another module's internal folders.

### 10. Scheduled and manual entrypoints

Keep `src/app/api/internal/search-index-worker/route.ts`, but make it a bounded adapter that:

- accepts only the Vercel `CRON_SECRET` bearer token;
- rejects missing or incorrect authorization;
- invokes `processPendingJob()` exactly once;
- returns a validated generic processed/skipped response with safe counters;
- emits safe structured start, completion, skip and failure logs; and
- never returns a raw internal/provider/database error.

Keep the existing Vercel schedule:

```text
0 8 * * *
```

The daily refresh delay is accepted for this portfolio. Real-time indexing and a faster schedule are not requirements.

Replace the resident/polling worker with one one-shot job entrypoint shared by local and production scripts.

Keep one rebuild maintenance entrypoint. It must call `requestRebuild()` and then invoke the same one-shot processing path. It must not clear chunks first or implement another rebuild algorithm.

The final developer-facing operational scripts are exactly:

```text
index:run
index:run:production
index:rebuild
index:rebuild:production
```

Required usage:

```bash
# Process one pending local job and exit
npm run index:run

# Process one pending production job and exit
npm run index:run:production -- --confirm-production

# Request and process one full local rebuild
npm run index:rebuild

# Request and process one full production rebuild
npm run index:rebuild:production -- --confirm-production
```

Both production commands must require the operator to supply `--confirm-production`. Do not bake confirmation into `package.json`. Reuse the repository's existing production confirmation and target-safety conventions.

Normal production indexing requires no remembered command because the database trigger plus daily cron own it.

A focused test script such as `test:search-index` is a validation command, not part of the operational command limit, and should be added if it makes the required database/unit coverage clear.

### 11. Environment and logging

Keep the documented indexing/runtime requirements:

- `DATABASE_URL`;
- `OPENAI_API_KEY`;
- `OPENAI_EMBEDDING_MODEL`; and
- deployed `CRON_SECRET`.

Remove indexing reads and documentation for:

- `SEARCH_INDEX_WORKER_SECRET`; and
- `SEARCH_INDEX_BATCH_LIMIT`.

Do not create separate local and production business logic. Environment-file selection and the production confirmation flag belong in thin entrypoints only.

Use the existing backend logger with stable safe events such as:

```text
search_index.worker_started
search_index.worker_skipped
search_index.worker_completed
search_index.worker_failed
search_index.stale_job_recovered
```

Safe context may include attempt, duration, document count, chunk count, configured model name and final status. Never log or persist credentials, complete embeddings, raw OpenAI responses, arbitrary content bodies or stack traces intended only for internal debugging.

Vercel Runtime Logs provide execution history. The singleton row provides current status and the latest sanitised failure. Do not add a dashboard, public status API, event bus or history table.

---

## Remove obsolete indexing architecture

Remove the behaviours and files represented by:

- the legacy source input contract and schema;
- `SourceRecordRepository` and its interface;
- direct single-source indexing;
- per-source `upsert` and `delete` processing;
- preview CLI;
- public status CLI/service methods;
- continuous polling/sleeping worker logic;
- clean-first rebuild behaviour;
- configurable worker batch size;
- indexing-specific HTTP secret fallback; and
- legacy compatibility tests whose purpose is to prove indexing remains disabled.

Remove the obsolete package scripts:

```text
index:source
index:worker
index:worker:production
index:status
index:status:production
index:preview
```

Do not retain compatibility wrappers, duplicate types, dead exports or two canonical import paths after removal.

Keep:

- `site_chunks`;
- pgvector and its HNSW index;
- `match_site_chunks()`;
- `SiteSearchService`;
- assistant query embedding/search behaviour;
- the shared OpenAI provider;
- deterministic text chunking and hashes;
- the protected scheduled Route Handler; and
- the daily Vercel cron.

---

## Application independence and regression boundaries

The admin and every other portfolio writer perform ordinary CRUD only.

Do not add indexing calls to:

- admin Server Actions;
- portfolio administration services;
- portfolio repositories;
- portfolio bootstrap/seed code;
- cache invalidation helpers; or
- public page adapters.

The database trigger must make writes from the admin, bootstrap scripts, direct SQL and future backends behave the same way.

Do not redesign:

- the portfolio content schema beyond the `SearchIndexJob` model and required indexing migration;
- public portfolio rendering or cache invalidation;
- Supabase Auth or Storage;
- assistant orchestration, prompts, streaming or tool selection;
- assistant query embedding or similarity thresholds;
- Meeting/Google Calendar behaviour; or
- unrelated deployment infrastructure.

---

## Implementation phases and mandatory checkpoints

### Phase 0 — Preflight

- verify branch/workflow state and freeze this contract;
- inspect the installed Next.js, Prisma, Supabase and OpenAI package versions;
- read relevant bundled Next.js Route Handler documentation;
- inspect the complete historical migration chain and current production-facing schema assumptions;
- inspect current portfolio public service shapes, search retrieval defaults, entrypoints, logs and tests; and
- record the exact old indexing files/scripts that the final cleanup must remove.

### Phase 1 — Database job foundation

- add the forward migration and update the Prisma job model;
- implement singleton repository transitions;
- validate all constraints, RLS, grants, triggers, coalescing, rollback behaviour, claims, stale recovery, reruns and retries against disposable PostgreSQL before proceeding.

### Phase 2 — Snapshot and atomic replacement

- implement the pure current-portfolio mapper;
- adapt deterministic chunking/types;
- implement complete embedding validation;
- implement atomic whole-snapshot replacement; and
- prove mapping, deduplication, failure preservation and transaction rollback with focused tests.

### Phase 3 — Service, composition and adapters

- reduce the service/interface surface;
- compose current portfolio services through the public module boundary;
- simplify the cron route;
- replace the polling worker with one-shot execution;
- make rebuild reuse the same path; and
- add the final four operational scripts with production guards.

### Phase 4 — Removal, documentation and full verification

- delete obsolete source/status/preview/polling compatibility code;
- update tests without preserving old paths;
- update active documentation and environment examples;
- run focused, disposable-database and repository-wide validation;
- inspect the final diff for scope, security and architecture; and
- commit, push, open/update one Milestone 17 pull request and enter independent review.

Do not begin a later phase while the prior phase has a known correctness or migration failure.

---

## Focused test requirements

Tests must verify public behaviour and important boundaries, not filenames or private helper implementation.

### Migration and real PostgreSQL behaviour

Use a disposable PostgreSQL database to prove:

- the complete historical Prisma migration chain applies cleanly from empty state;
- the new migration also applies cleanly to a representative populated pre-Milestone-17 schema;
- `site_chunks`, `match_site_chunks()` and unrelated Meeting/portfolio data survive the forward migration;
- obsolete trigger/function/job objects are replaced as intended;
- queue constraints reject invalid key, status and attempt values;
- RLS is enabled and table/function access is revoked from `public`, `anon` and `authenticated`;
- every one of the thirteen portfolio tables has the statement-level mutation trigger;
- committed insert, update and delete operations request the singleton job;
- representative base, subtype and ordered-junction mutations request work;
- a rolled-back mutation does not leave a committed request;
- repeated writes coalesce to one row;
- a mutation during `processing` sets `rerun_requested`;
- completion after a rerun request returns the job to pending;
- concurrent claims cannot both succeed;
- stale work is recovered without bypassing the attempt limit;
- the third failed attempt becomes terminal;
- a later mutation or forced rebuild recovers terminal failure; and
- atomic replacement commits all new chunks or preserves all old chunks on failure.

Do not satisfy database-trigger acceptance with migration-text regex assertions alone.

### Pure mapper and service behaviour

Use small fakes/injected effects to prove:

- Profile, recursive ContentBlock trees, Projects and Experiences map to the approved stable identities;
- top-level blocks, Projects and Experiences are deduplicated by ID;
- nested relation order is deterministic and meaningful child/icon/media/action text is retained;
- non-public/internal fields and storage URLs are excluded;
- public provenance URLs are valid;
- an empty or invalid snapshot fails before deletion;
- mapper/chunker failure preserves the prior index;
- OpenAI failure preserves the prior index;
- embedding count, numeric-value or dimension mismatch preserves the prior index;
- successful service execution replaces the snapshot and settles the job;
- a request arriving during processing is not lost;
- failure/retry results and logs contain only safe information; and
- no-work execution returns skipped and exits without embedding or write effects.

Tests with a fake OpenAI provider prove orchestration only. They must not be reported as verification of the live OpenAI API.

### Adapter, command and regression behaviour

Verify:

- the cron route rejects missing and incorrect bearer secrets;
- the cron route uses only `CRON_SECRET` and calls one worker attempt;
- route errors are generic while backend logs remain contextual;
- the run command performs at most one claim and exits;
- rebuild first requests work and then uses the same one-shot worker path;
- both production commands reject missing operator-supplied confirmation;
- local and production entrypoints share business logic;
- admin/portfolio writes do not directly call the search-index service;
- bootstrap/seed writes cause pending work through real database triggers;
- assistant retrieval retains the existing match defaults and response mapping; and
- existing assistant, portfolio admin, auth, media and meeting tests remain green.

---

## Documentation requirements

Update `README.md`, `docs/portfolio-content-system.md`, `.env.example` where applicable, and other active operational documentation so it describes only the final system:

- database-driven enqueue behaviour;
- why the system rebuilds the full small portfolio;
- the singleton job states and three-attempt recovery behaviour;
- daily production processing;
- the four manual indexing commands;
- required environment variable names;
- how to inspect the singleton row safely;
- how to inspect safe Vercel Runtime Logs;
- local migration/bootstrap/indexing workflow;
- the controlled production rollout and confirmation guard;
- the fact that admin and other writers do not call indexing code; and
- the real limitation that changes wait for the next worker run unless a manual run is invoked.

Remove active documentation claiming current portfolio indexing is deferred, disabled, source-specific, batch-based or operated with the deleted scripts.

Do not rewrite historical milestone contracts to make old decisions appear current. Do not add ignored `docs/indexing/` analysis notes to version control.

---

## Explicitly out of scope

Milestone 17 does not include:

- real-time or per-request indexing;
- a faster cron schedule;
- incremental embedding reuse;
- dependency-aware partial rebuilds;
- source-specific jobs or delete tombstones;
- a message broker, event bus, Supabase Edge Function or Vercel Queue;
- permanent polling workers or worker fleets;
- a dead-letter table or durable job-history table;
- a public queue/status API or observability dashboard;
- admin indexing controls;
- application-level mutation hooks;
- additional embedding models or vector dimensions;
- semantic chunker redesign;
- assistant prompt/tool/orchestration redesign;
- portfolio schema/content redesign;
- migration squashing;
- production database mutation during automated implementation/review; or
- unrelated cleanup.

Do not add infrastructure for hypothetical scale.

---

## Required validation

Run targeted checks first, then the full repository gates. The final implementation/review evidence must include exact commands and outcomes for:

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run test:portfolio:admin
npm run test:search-index
npm run build
git diff --check
```

`test:search-index` must include the focused unit/adapter coverage and an explicit disposable-PostgreSQL path. If the aggregate script deliberately skips the database suite without a test database URL, separately run the database suite with an explicitly named disposable PostgreSQL database and report that result.

Also verify:

- full migration history from empty database;
- forward migration over representative protected/populated data;
- Prisma schema/client generation after migration changes;
- no generated validation artefact is accidentally committed;
- final operational script list contains exactly the four approved indexing commands;
- no stale imports, exports, compatibility files or active documentation remain; and
- final worktree and pull-request head are exact and clean.

Build against a migrated, bootstrapped disposable database when the ambient configured database is stale. Do not mutate an ambient or production database merely to make validation pass.

If Google Fonts, OpenAI, GitHub, Vercel or another external service is unavailable, report the precise boundary as `NOT VERIFIED` where permitted by the workflow. Do not add a production workaround. Core local unit, migration and disposable-database correctness are not optional merely because live OpenAI credentials are unavailable.

Use the architecture completion format required by `.agents/skills/nextjs-architecture/SKILL.md`.

---

## Agent-verifiable acceptance criteria

Checklist boxes remain unchecked. The independent review records `PASS`, `FAIL` or `NOT VERIFIED` with evidence for each criterion.

### Workflow and scope

- [ ] Implementation began from the exact latest remote default branch after Milestone 16 merge/archive and branch cleanup were verified.
- [ ] This contract was frozen before implementation changes began.
- [ ] One Milestone 17 branch and one pull request are used; the agent does not merge it.
- [ ] Final changes remain within database-driven assistant indexing and its required tests/docs.
- [ ] No ignored indexing analysis document was committed.

### Database and migration

- [ ] The complete historical Prisma migration chain applies cleanly to an empty disposable PostgreSQL database.
- [ ] The forward migration preserves existing portfolio, Meeting and `site_chunks` data plus `match_site_chunks()` until successful worker replacement.
- [ ] The legacy job schema, orphaned function and obsolete triggers are replaced without editing historical migrations.
- [ ] The singleton job table enforces its key, status and non-negative-attempt invariants.
- [ ] Queue RLS/grants and trigger-function privileges prevent public/anon/authenticated access.
- [ ] All thirteen approved portfolio tables have statement-level insert/update/delete triggers and no unrelated table has one.
- [ ] Real database tests prove committed mutations enqueue, rollbacks do not, and repeated writes coalesce.
- [ ] The migration creates initial pending work for an already-populated database.

### Job lifecycle and concurrency

- [ ] At most one worker can atomically claim the singleton pending job.
- [ ] A mutation during processing sets `rerun_requested`, and completion returns the job to pending.
- [ ] Abandoned processing older than ten minutes is recoverable without unbounded retries.
- [ ] Failures preserve prior chunks, retry no more than three attempts and then become terminal.
- [ ] A newer mutation during a failed attempt is not lost.
- [ ] A later content mutation or explicit rebuild recovers a terminal failed job.
- [ ] One worker invocation handles at most one claim and never polls or sleeps.

### Snapshot, embeddings and replacement

- [ ] The indexer obtains current content through the portfolio module's public Home, Work, About and Audit service interfaces.
- [ ] Profile, top-level recursive ContentBlocks, Projects and Experiences use stable approved identities and are deduplicated correctly.
- [ ] Mapping uses an explicit public-field allowlist and excludes secrets, storage URLs, internal timestamps and arbitrary serialisation.
- [ ] Recursive relation ordering and meaningful nested icon/media/action content are deterministic.
- [ ] Complete-snapshot preparation is deterministic and retains stable chunk identities/hashes.
- [ ] Every rebuild embeds the full prepared snapshot; no incremental reuse was added.
- [ ] Empty snapshots and invalid embedding count/type/dimension fail before any destructive database write.
- [ ] OpenAI and mapping failures leave the previous searchable snapshot intact.
- [ ] Successful replacement removes legacy/current chunks and inserts the complete new snapshot atomically.
- [ ] No OpenAI call or document preparation occurs inside the replacement transaction.

### Module, adapter and command boundaries

- [ ] `ISearchIndexService` exposes only one-shot pending processing and rebuild-request behaviour required by outer adapters.
- [ ] `SiteSearchService`, query embedding and assistant similarity-search defaults remain compatible.
- [ ] Search-index composition uses deliberate portfolio public interfaces and does not reach into portfolio repositories/internals.
- [ ] Repositories and mappers remain internal to the search-index module.
- [ ] The cron route authenticates only with `CRON_SECRET`, invokes once, returns a validated safe result and never exposes raw failures.
- [ ] The Vercel cron remains daily at `0 8 * * *`.
- [ ] The final operational indexing command surface contains exactly `index:run`, `index:run:production`, `index:rebuild` and `index:rebuild:production`.
- [ ] Rebuild reuses the same one-shot processing algorithm and never clears chunks first.
- [ ] Production commands require an operator-supplied `--confirm-production` and retain local/production target guards.
- [ ] `SEARCH_INDEX_WORKER_SECRET` and `SEARCH_INDEX_BATCH_LIMIT` have no active code or documentation references.
- [ ] Obsolete source, preview, status, polling, per-source delete and disabled-compatibility paths are removed without wrappers.

### Independence, safety and observability

- [ ] Admin, bootstrap, portfolio repositories and cache code contain no direct indexing call or application-level enqueue hook.
- [ ] Admin, seed/bootstrap and direct SQL writes are proven to request work through PostgreSQL.
- [ ] Structured logs cover start, skip, completion, failure and stale recovery with useful safe context.
- [ ] Queue state and logs do not contain credentials, embeddings, raw provider payloads, content dumps or client-visible stack traces.
- [ ] No new infrastructure, production dependency or parallel migration system was added.
- [ ] Portfolio rendering/cache/auth/media, assistant orchestration and Meeting behaviour were not intentionally redesigned.

### Tests, documentation and quality

- [ ] Focused unit, adapter and disposable-PostgreSQL tests cover the required migration, lifecycle, mapping, replacement, route and command behaviour.
- [ ] Database-trigger acceptance is based on executed PostgreSQL behaviour, not only SQL-text matching.
- [ ] Existing assistant, portfolio admin and integration tests pass without weakened assertions.
- [ ] README, portfolio content-system documentation and environment examples describe the final workflow and only the four approved operational commands.
- [ ] Active documentation no longer describes indexing as deferred or the disabled legacy commands as current.
- [ ] Repository-standard validation and production build pass, or a genuine external-only limitation is recorded precisely without a workaround.
- [ ] Architecture validation passes and the final diff contains no stale/debug/generated/unrelated changes.

---

## Manual tasks

These steps require Freeman's local/production credentials or operational access. They remain pending at `ready_for_human` and must not be converted into implementation findings when the supporting code and documentation are correct.

### Local live integration

1. Apply/reset the local Prisma database using the documented workflow.
2. Run the existing portfolio bootstrap.
3. Confirm the singleton job is pending without calling indexing from the bootstrap code.
4. Run `npm run index:run` with a real OpenAI key.
5. Confirm the job completes and `site_chunks` contains only the new current-domain identities.
6. Ask the local assistant questions grounded in Profile, ContentBlock, Project and Experience content.
7. Edit one portfolio record through the admin and confirm the database returns the singleton job to pending.
8. Run the one-shot worker again and confirm the answer reflects the edit.
9. Delete an optional test record, rebuild, and confirm its content no longer appears.

### Controlled production rollout

1. Disable or pause the Vercel search-index cron before the queue-schema transition.
2. Merge and deploy the reviewed Milestone 17 application while the cron remains paused.
3. Apply the forward migration using the documented production Prisma migration command.
4. Confirm the deployment is healthy and the migration-created singleton job is pending.
5. Run `npm run index:run:production -- --confirm-production` once.
6. Confirm the job completes, current chunks are searchable and no legacy chunks remain.
7. Re-enable/confirm the daily Vercel cron.
8. Perform one safe production portfolio edit and confirm the database marks the singleton pending without an admin indexing call.
9. After the scheduled run, or an explicitly confirmed manual run, verify the assistant reflects the edit.
10. Inspect Vercel Runtime Logs for the expected safe structured events and absence of raw content/secrets.

Do not run production migrations, indexing or content mutations automatically during implementation/review.

---

## Manual acceptance criteria

- [ ] A real local OpenAI run completes and replaces the legacy index with current portfolio documents.
- [ ] The local assistant retrieves current Profile, ContentBlock, Project and Experience information accurately enough for the existing assistant flow.
- [ ] A local admin or SQL mutation creates pending work without any application indexing hook.
- [ ] Updated content appears after the next worker run, and deleted content disappears after successful replacement.
- [ ] Production migration and first confirmed one-shot run complete without losing the previously working index on failure.
- [ ] The daily production cron processes database-created work successfully.
- [ ] Production Vercel logs are useful for diagnosing indexing while remaining free of secrets, raw content and provider payloads.
- [ ] Normal portfolio editing requires no indexing knowledge; manual commands are needed only for immediate refresh/recovery.

---

## Completion / `ready_for_human` report

In addition to the workflow's normal machine-readable result, the final handoff must provide a concise phone-readable summary containing:

- pull request number/link;
- reviewed head SHA;
- the final architecture in three plain-English sentences;
- migration and queue-security result;
- exact final four operational commands;
- daily cron schedule;
- exact retry/recovery behaviour;
- validation results, including disposable PostgreSQL coverage;
- live OpenAI/production checks reported honestly as verified or pending;
- the controlled production rollout steps;
- the manual local and production checks Freeman must perform;
- active documentation paths; and
- any real remaining limitations.

Do not require Freeman to reconstruct deployment or verification steps from commit messages, private artefacts or review threads.
