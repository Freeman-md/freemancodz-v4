# Milestone 4: Database-Backed Search Indexing

**Status:** Frozen  
**Version:** 1.0.0  
**Last Updated:** 2026-07-18  
**Depends On:** Milestone 3 and Milestone 3 Amendment 1  
**Target Pull Request:** —  
**Target Branch:** `feat/milestone-4-database-search-indexing`  
**Superseded By:** —

## Goal

Make the Prisma portfolio tables the only content source for both the rendered website and the assistant retrieval index.

When a searchable source record is inserted, semantically updated or deleted, a small durable job must be created. A server-side worker must process that job, rebuild only the affected search documents, generate embeddings only when required, and keep `site_chunks` synchronized.

Retrieval must continue to return the same assistant-facing data, but it must query pgvector through Prisma rather than the Supabase `match_site_chunks` RPC.

The implementation must remain small, explicit and reviewable. Do not introduce a generic indexing framework, speculative source types or unnecessary architectural layers.

## Current repository state

The implementation agent must inspect the repository before editing. The current relevant boundaries are:

- Portfolio pages already read `ContentBlock`, `Project`, `Service`, `Principle` and `Experience` records through Prisma.
- Milestone 3 introduced typed Zod schemas for the current `ContentBlock.content` payloads.
- `src/lib/rag/build-site-chunks.ts` still builds chunks from static `src/data/*` files.
- `scripts/seed-site-chunks.ts` still embeds static chunks and writes them through the Supabase client.
- `src/lib/rag/match-site-chunks.ts` still calls the Supabase `match_site_chunks` RPC.
- `src/lib/rag/types.ts` still derives retrieval types from generated Supabase types.
- Prisma is the migration source of truth for application database objects.

Any already-created local SiteChunk schema or Prisma migration work must be inspected and preserved. Do not create duplicate migrations for fields or indexes that already exist.

## Required end state

```text
Prisma source tables
  -> database trigger records a small indexing job
  -> worker loads the latest source record through Prisma
  -> source-specific builder creates SearchDocument[]
  -> deterministic embedding input and content hash
  -> embed only new or changed documents
  -> upsert current site_chunks and remove obsolete chunks
  -> assistant retrieval queries site_chunks through Prisma + pgvector
```

The source tables are canonical. `site_chunks` is derived data and must be safely rebuildable.

## Scope

This milestone covers the complete indexing path for the current five source tables:

- `content_blocks`
- `projects`
- `services`
- `principles`
- `experiences`

It includes:

- explicit retrieval decisions
- typed search-document contracts
- pure source builders
- Prisma-backed source readers
- stable chunk identities
- deterministic embedding input
- content hashing
- single-source indexing and deletion
- a database-backed full rebuild
- preview and dry-run support
- a durable indexing queue
- source-table triggers
- a local worker command
- one protected production worker entry point using the same indexing use cases
- production scheduling instructions/configuration
- Prisma-backed vector retrieval
- removal of the legacy static chunk seed and Supabase RPC dependency

## Source retrieval decisions

The implementation must make these decisions explicit in a small typed configuration or similarly direct module. Do not build a generic registry framework.

### Projects

- Every row searchable: yes
- Public URL: `/work`
- Documents per row: one
- Display category: use the stored project `category`
- Semantic fields:
  - `title`
  - `summary`
  - `category`
  - `role`
  - `outcome`
  - `detail`
  - `future`
  - `collaboration`
  - `positioning`
  - `stacks`
- Excluded from retrieval text and re-embedding decisions:
  - `id`
  - `featured`
  - `position`
  - `links`
  - `createdAt`
  - `updatedAt`

### Services

- Every row searchable: yes
- Public URL: `/`
- Documents per row: one
- Display category: `Service`
- Semantic fields:
  - `title`
  - `lead`
  - `description`
  - `assistantPrompt`
- Excluded from retrieval text and re-embedding decisions:
  - `id`
  - `cta`
  - `position`
  - `createdAt`
  - `updatedAt`

### Principles

- Every row searchable: yes
- Documents per row: one
- Display category: `Principle`
- Public URL:
  - `section = home` -> `/`
  - `section = about` -> `/about`
- Semantic fields:
  - `section`
  - `title`
  - `body`
- Excluded from retrieval text and re-embedding decisions:
  - `id`
  - `position`
  - `createdAt`
  - `updatedAt`

### Experiences

- Every row searchable: yes
- Public URL: `/about`
- Documents per row: one
- Display category: use the stored experience `category`
- Semantic fields:
  - `title`
  - `company`
  - `dates`
  - `location`
  - `category`
  - `focus`
- Excluded from retrieval text and re-embedding decisions:
  - `id`
  - `position`
  - `createdAt`
  - `updatedAt`

### ContentBlocks

Not every future `ContentBlock` is automatically searchable. Unknown keys or unsupported sections must return no search documents and must not be generically stringified.

Every currently supported ContentBlock row produces one document.

| Block identity | URL | Category | Semantic payload fields |
| --- | --- | --- | --- |
| `home.hero` | `/` | `Profile` | `name`, `headline`, `intro`, `heroNote` |
| `home.philosophy` | `/` | `Profile` | `philosophyQuestion` |
| `home.current-direction` | `/` | `Profile` | `currentDirection`, `currentDirectionSupport` |
| `about.header` | `/about` | `Profile` | `aboutHeadline` |
| `about.education` | `/about` | `Education` | `current`, `previous`, `research`, `support` |
| `ABOUT_INTRO` rows | `/about` | `Profile` | `body` |
| `WORK_PROCESS` rows | `/about` | `Work Process` | `body` |
| `OUTSIDE_ENGINEERING` rows | `/about` | `Outside Engineering` | `title`, `description` |

ContentBlock builders must reuse the Zod schemas introduced in Milestone 3. The dispatcher must validate the expected key, page and section before formatting a document.

Excluded ContentBlock fields:

- `id` as retrieval text
- `key` as retrieval text
- `page` as retrieval text
- `section` as retrieval text
- `position`
- `createdAt`
- `updatedAt`
- arbitrary JSON properties not declared by the matching Zod schema

The ID, key, page and section may be used for dispatch, stable identity and metadata. They must not be blindly added to embedding text.

## Canonical contracts

Define a small set of clear types. Exact file names may follow repository conventions.

```ts
type IndexableSourceType =
  | "content_blocks"
  | "projects"
  | "services"
  | "principles"
  | "experiences";

type SearchDocument = {
  sourceType: IndexableSourceType;
  sourceId: string;
  documentIndex: number;
  title: string;
  category: string;
  url: string;
  content: string;
  keywords: string[];
};

type IndexingJob =
  | {
      operation: "upsert";
      sourceType: IndexableSourceType;
      sourceId: string;
    }
  | {
      operation: "delete";
      sourceType: IndexableSourceType;
      sourceId: string;
    };
```

These types must remain application-focused. Do not copy complete source records into queue jobs.

## Builder boundaries

Create one focused builder per current source type:

- `buildProjectDocuments(project)`
- `buildExperienceDocuments(experience)`
- `buildServiceDocuments(service)`
- `buildPrincipleDocuments(principle)`
- `buildContentBlockDocuments(contentBlock)`

Each builder must:

- accept an already-loaded Prisma record
- return `SearchDocument[]`
- contain no Prisma calls
- contain no OpenAI calls
- contain no Supabase calls
- produce readable, deliberate text
- produce deterministic metadata and keyword order
- include only the approved semantic fields
- currently produce one document with `documentIndex = 0`

Keep the array return type so the system can support multiple documents later without changing the indexing contract. Do not add chunk-splitting logic in this milestone because the current records do not require it.

ContentBlock formatting must dispatch by the current key or validated section and use the existing Zod schemas. Raw JSON must never reach the embedding formatter.

## Source readers

Create a small Prisma-backed indexing data boundary that can:

- load one source record by `sourceType` and `sourceId`
- load all current records for a full rebuild
- determine whether a source still exists

The readers may reuse existing portfolio query ideas, but indexing queries must have an explicit server-only boundary. Builders must not query Prisma.

The static `src/data/*` modules must no longer be imported by the chunk-building or indexing pipeline.

## SiteChunk contract

Use the agreed SiteChunk model and its existing Prisma migration work. The final model must support:

- `id`
- `sourceType`
- `sourceId`
- `chunkIndex`
- `title`
- `category`
- `url`
- `content`
- `keywords`
- `embedding` as `vector(1536)`
- `contentHash`
- `embeddingModel`
- `embeddedAt`
- `createdAt`
- `updatedAt`
- a unique constraint on `(sourceType, sourceId, chunkIndex)`

Stable chunk IDs must be derived from source identity, never titles:

```text
<sourceType>:<sourceId>:<chunkIndex>
```

Examples:

```text
projects:2d6b...:0
content_blocks:f83a...:0
```

Renaming a record must not create a new unrelated chunk. Rebuilding the same source must produce the same IDs.

Prisma migrations remain the only application migration history. PostgreSQL-specific SQL belongs inside Prisma migration files where required.

The final migration state must include:

- `vector` extension
- `vector(1536)` embedding column
- the source metadata and hash fields
- the unique source/chunk constraint
- the existing HNSW cosine index
- RLS and direct-client privilege restrictions already agreed for application tables
- queue table and trigger functions required by this milestone

Do not create a second active Supabase migration history for these objects.

## Embedding input and hashing

There must be exactly one canonical embedding-input formatter.

The exact format is:

```text
Title: <title>
Category: <category>
Keywords: <comma-separated keywords>
Content: <content>
```

The public URL remains chunk metadata and must not be included in embedding input.

Before formatting:

- remove empty keyword values
- normalize and deduplicate keywords
- keep their order deterministic

Generate:

```text
contentHash = SHA-256(exact embedding input)
```

Do not hash raw database records.

A chunk is unchanged only when both are unchanged:

- `contentHash`
- `embeddingModel`

An unchanged chunk must not call OpenAI and must not rewrite `embeddedAt`.

## Single-source indexing

Implement the core use case:

```ts
indexSourceRecord({ sourceType, sourceId })
```

It must:

1. Load the latest source row.
2. Build its search documents.
3. Create stable chunk IDs and deterministic embedding inputs.
4. Calculate content hashes.
5. Load all existing chunks for that source.
6. Classify chunks as unchanged, changed, new or obsolete.
7. Generate embeddings only for changed and new chunks.
8. Upsert current chunks.
9. Delete obsolete chunks.
10. Return useful created, changed, unchanged and deleted counts.

Do not keep a database transaction open while waiting for OpenAI. Complete external embedding calls first, then apply the final database writes and obsolete-chunk deletion atomically where practical.

If any required embedding call fails, the previously valid indexed state for that source must not be partially replaced.

Errors must identify `sourceType` and `sourceId`.

Because Prisma exposes the vector field as unsupported, isolate raw SQL to the smallest repository/helper boundary required to read and write vectors. Do not spread raw SQL through builders, workers or route handlers.

## Source deletion

Implement separately:

```ts
removeIndexedSource({ sourceType, sourceId })
```

It must delete all chunks for the source identity. Repeating the operation must be harmless.

Normal indexing must not pretend it can load a deleted source row.

## Full rebuild and inspection commands

Replace the legacy static seed workflow with database-backed commands using the same builders and `indexSourceRecord()` logic.

Required package commands:

```text
npm run index:source -- <sourceType> <sourceId> [--dry-run]
npm run index:rebuild -- [--dry-run]
npm run index:worker
```

`index:source --dry-run` must show:

- generated document text
- chunk ID
- embedding input
- content hash
- expected action: create, change, skip or delete

`index:rebuild` must:

- read every current indexable source row
- call the same single-source indexing logic
- report created, changed, unchanged and deleted totals
- remove orphaned chunks whose source no longer exists
- be safe to run repeatedly

`index:rebuild --dry-run` must perform no OpenAI calls and no database writes.

Remove the old `seed:chunks` command, `scripts/seed-site-chunks.ts` and the static `buildSiteChunks()` dependency when their replacements are complete.

The portfolio seed remains responsible only for canonical source records. It must not become an embedding/indexing script.

## Durable queue

Use one small Postgres queue table named `search_index_jobs`. Do not add pgmq or another queue framework unless repository evidence proves the plain table cannot satisfy this contract.

The queue must persist at least:

- source type
- source ID
- operation: `upsert` or `delete`
- attempt count
- next available time
- lock time
- last error
- created/updated timestamps

Keep at most one pending job per `(sourceType, sourceId)`. Enqueueing a newer operation for the same source must update the pending job to the latest operation and make it available again.

A worker must claim jobs safely using a transaction and row locking such as `FOR UPDATE SKIP LOCKED`, or an equally safe small implementation.

On success, acknowledge or remove the job.

On failure:

- preserve the job
- record a useful error
- increment attempts
- release it for retry after a small delay

Do not build a dashboard, dead-letter system or complex backoff framework in this milestone.

## Source-table triggers

Create lightweight PostgreSQL triggers through Prisma migration SQL.

For insert:

- enqueue `upsert`

For delete:

- enqueue `delete`

For update:

- enqueue `upsert` only when approved semantic or identity-routing fields change

The trigger must not call OpenAI, build documents, call an HTTP endpoint or write `site_chunks` directly.

Relevant update fields are:

### `projects`

- `title`
- `summary`
- `category`
- `role`
- `outcome`
- `detail`
- `future`
- `collaboration`
- `positioning`
- `stacks`

Do not queue for `featured`, `position`, `links` or timestamps alone.

### `services`

- `title`
- `lead`
- `description`
- `assistant_prompt`

Do not queue for `cta`, `position` or timestamps alone.

### `principles`

- `section`
- `title`
- `body`

Do not queue for `position` or timestamps alone.

### `experiences`

- `title`
- `company`
- `dates`
- `location`
- `category`
- `focus`

Do not queue for `position` or timestamps alone.

### `content_blocks`

- `key`
- `page`
- `section`
- `content`

Do not queue for `position` or timestamps alone.

## Worker

Create one reusable batch-processing use case and expose it through:

- the local `npm run index:worker` command
- one protected production server endpoint

The local command and production endpoint must not contain separate indexing implementations.

The worker must:

1. Claim a limited batch.
2. validate each job payload
3. call `indexSourceRecord()` or `removeIndexedSource()`
4. acknowledge successful jobs
5. preserve failed jobs for retry
6. log the source identity and failure context
7. stop cleanly when no jobs are available

A single run may process one or more finite batches and then exit. Do not build a permanently running daemon unless the repository deployment model requires it.

## Production worker entry point

Use a small server-only Next.js route handler or equivalent Node-compatible entry point so the implementation can reuse the Prisma and indexing modules directly.

The endpoint must:

- accept only protected `GET` requests from Vercel Cron
- require `Authorization: Bearer <CRON_SECRET>`
- return no database credentials, OpenAI details or source content
- process a bounded batch
- report only safe counts

Do not duplicate the indexing logic in a Supabase Edge Function merely to use a different runtime.

Document the exact production configuration required to invoke the endpoint every five minutes through Vercel Cron. Environment-specific secrets must not be committed.

Scheduler setup that requires production credentials belongs under manual tasks, but the repository must contain the protected endpoint and clear setup instructions.

### Vercel Cron production operation

`vercel.json` schedules `GET /api/internal/search-index-worker` every five minutes. The route runs in the Node.js runtime, requires `Authorization: Bearer <CRON_SECRET>`, and processes exactly one bounded batch per invocation. Vercel Cron supplies the Bearer value from `CRON_SECRET`; do not put this value in a URL or source control.

Configure these production environment variables in Vercel:

- `DATABASE_URL` — Prisma application connection string.
- `OPENAI_API_KEY` — embeddings API key.
- `CRON_SECRET` — secret used by Vercel Cron and the protected worker route.
- `SEARCH_INDEX_BATCH_LIMIT` — optional batch size from 1 to 20; invalid values use 5.

Future invocations continue draining queued work. `FOR UPDATE SKIP LOCKED` prevents two invocations from claiming the same job, while existing content hashes keep indexing idempotent when no semantic embedding change is required.

Run production migrations manually from a trusted local machine or CI environment with `npm run prisma:migrate:production`. Run production seeds and rebuilds manually with production credentials and the explicit confirmation flag:

```text
npm run seed:portfolio:production -- --confirm-production
npm run index:rebuild:production -- --confirm-production
npm run index:status:production
```

Never use `prisma migrate reset`, `prisma migrate dev`, or `prisma db push` against production.

First deployment checklist:

1. Set `DATABASE_URL`, `OPENAI_API_KEY`, `CRON_SECRET`, and any desired `SEARCH_INDEX_BATCH_LIMIT` in Vercel production settings.
2. Run `npm run prisma:migrate:production` from a trusted environment.
3. Deploy the commit containing `vercel.json` and confirm the cron path is listed in the production deployment.
4. Use `npm run index:status:production` to confirm queue visibility, then safely update a source and verify a subsequent cron invocation drains its job.

## Prisma-backed retrieval

Replace the Supabase RPC implementation of `matchSiteChunks()` with a Prisma-backed pgvector query.

Keep the existing application-facing behaviour:

- validate that query embeddings contain 1536 values
- accept match count and threshold
- calculate cosine similarity
- filter by threshold
- order by best similarity
- return `id`, `title`, `category`, `url`, `content`, `keywords` and `similarity`

Define the return type locally. It must no longer depend on generated Supabase function types.

Keep raw SQL inside the focused retrieval boundary. The assistant route and `retrieveContext()` should not need to understand SQL or Prisma details.

Remove the active `match_site_chunks` RPC dependency and update or replace `test:rag-rpc` accordingly.

Do not change query expansion, assistant prompting, citation behaviour or retrieval thresholds unless required to preserve current behaviour after the data-access change.

## Suggested implementation shape

This structure is illustrative. Preserve repository conventions and keep equivalent responsibilities separated.

```text
src/lib/rag/
├── types.ts
├── source-config.ts
├── embedding-input.ts
├── match-site-chunks.ts
├── retrieve-context.ts
├── builders/
│   ├── content-block.builder.ts
│   ├── experience.builder.ts
│   ├── principle.builder.ts
│   ├── project.builder.ts
│   └── service.builder.ts
├── data/
│   ├── source-reader.ts
│   ├── site-chunk.repository.ts
│   └── indexing-job.repository.ts
└── indexing/
    ├── index-source-record.ts
    ├── remove-indexed-source.ts
    ├── rebuild-index.ts
    └── process-indexing-jobs.ts

scripts/
├── index-source.ts
├── rebuild-search-index.ts
└── process-search-index-jobs.ts
```

This does not authorize controllers, classes, dependency-injection containers or a generic repository framework. Small functions and focused modules are preferred.

## Required tests

Tests must be separated by responsibility rather than placed in one broad end-to-end file.

Required automated coverage:

1. Every current source type has an explicit retrieval decision.
2. Unknown ContentBlock keys or unsupported identities produce no documents.
3. Every current seeded ContentBlock identity is handled deliberately.
4. Each builder produces predictable readable text and metadata.
5. Builders exclude the declared UI-only fields.
6. ContentBlock builders parse payloads through the existing Zod schemas.
7. No raw JSON is included in embedding input.
8. Stable IDs use source type, source ID and chunk index rather than titles.
9. The embedding-input formatter produces the exact required text.
10. The content hash is generated from the exact embedding input.
11. Unchanged hash and model cause zero embedding calls.
12. A semantic change re-embeds only the affected chunks.
13. A UI-only change does not change the built document or content hash.
14. New chunks are created and changed chunks are updated.
15. Obsolete chunks are deleted when a builder returns fewer documents.
16. Source deletion removes all related chunks and is idempotent.
17. A failed embedding call does not partially replace the previous indexed source.
18. A full rebuild uses the same single-source indexing path.
19. Dry-run mode performs no OpenAI calls and no database writes.
20. Orphaned chunks are identified and removed by a real rebuild.
21. Queue jobs contain identity only and validate correctly.
22. Repeated enqueues for one source collapse to the latest pending operation.
23. Failed jobs remain available for retry with error context.
24. The worker calls the correct upsert or delete use case and acknowledges success.
25. Trigger migration SQL covers insert, relevant update and delete behaviour for all five source tables.
26. The production worker endpoint rejects missing or incorrect secrets.
27. The production worker endpoint processes a bounded batch with the shared worker use case.
28. Prisma-backed retrieval preserves vector-length validation, threshold filtering, ordering and result mapping.
29. Retrieval types no longer depend on generated Supabase RPC types.
30. The legacy static chunk seed and static chunk-builder imports are removed.
31. Prisma validation, Prisma generation, lint, typecheck, relevant tests and production build remain green.

Use small fakes or injected function dependencies for OpenAI and database effects in unit tests. Do not introduce a dependency-injection framework.

## Required validation

Use the exact scripts available after implementation. At minimum run:

```bash
npm install
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm run test:portfolio
npm run test:rag
npm run build
```

Also run the repository's migration and local integration checks when local Supabase is available.

Report exact commands and outcomes. Do not claim OpenAI, local Supabase or production scheduling was verified when only mocks or static inspection were used.

## Constraints

- Prefer the smallest complete implementation.
- Follow existing repository module and naming conventions.
- Use Prisma for source reads, queue access, chunk metadata and retrieval orchestration.
- Isolate raw SQL to pgvector and queue-claim boundaries that require it.
- Keep OpenAI and database credentials server-only.
- Do not expose worker secrets to client code.
- Do not call OpenAI inside database triggers.
- Do not call OpenAI while holding a database transaction.
- Do not synchronously embed during a source-table write.
- Do not create a second indexing path for rebuilds.
- Do not generically stringify Prisma records or ContentBlock JSON.
- Do not index fields merely because they exist in the database.
- Do not silently fall back to static content.
- Do not change public page UI, copy, ordering or rendering behaviour.
- Do not change assistant answer formatting or citation behaviour.
- Do not introduce a CMS or content-editing interface.
- Do not add speculative source tables.
- Do not add chunk splitting for current records.
- Do not add a queue dashboard, dead-letter UI or complex distributed worker framework.
- Do not merge the pull request.

## Explicitly out of scope

- A portfolio administration interface
- Browser-side indexing or embeddings
- Multi-user or tenant-specific indexes
- Uploading arbitrary documents
- General-purpose document parsers
- OCR or file extraction
- Reranking models
- Hybrid lexical/vector search
- Changes to the assistant system prompt
- Changes to query expansion heuristics
- New content sources outside the five listed tables
- Multiple worker services or distributed orchestration
- A permanent local daemon when a finite worker command is sufficient
- Monitoring dashboards beyond clear logs and inspectable queue rows
- Unrelated portfolio, UI or infrastructure refactoring

## Acceptance criteria

- [ ] The five current source tables have explicit, reviewed retrieval decisions.
- [ ] Unknown or unsupported ContentBlock identities are not indexed.
- [ ] Current ContentBlock payloads are validated through the Milestone 3 Zod schemas before formatting.
- [ ] Each source type has a focused pure builder returning `SearchDocument[]`.
- [ ] Builders include only declared semantic fields and exclude UI-only fields.
- [ ] The indexing pipeline no longer imports static `src/data/*` content.
- [ ] Search documents and chunk IDs are deterministic.
- [ ] SiteChunk rows are traceable by source type, source ID and chunk index.
- [ ] Prisma migrations are the only active application migration history.
- [ ] There is one canonical embedding-input formatter and URL is metadata only.
- [ ] Content hashes are calculated from the exact embedding input.
- [ ] Unchanged hash and model skip embedding generation.
- [ ] `indexSourceRecord()` handles unchanged, changed, new and obsolete chunks.
- [ ] A source embedding failure does not leave a partially updated index.
- [ ] `removeIndexedSource()` removes all chunks for a source and is idempotent.
- [ ] The full rebuild uses the same single-source indexing logic.
- [ ] Full rebuild removes orphaned chunks and is safe to repeat.
- [ ] Source preview and rebuild dry-run perform no OpenAI calls or writes.
- [ ] The legacy static chunk seed and static builder are removed.
- [ ] A durable `search_index_jobs` queue exists in Postgres.
- [ ] Queue jobs carry source identity rather than copied content.
- [ ] Source triggers enqueue insert, relevant update and delete operations.
- [ ] UI-only updates do not enqueue indexing work.
- [ ] Triggers never call OpenAI, HTTP endpoints or chunk builders.
- [ ] The local worker safely claims, processes, acknowledges and retries jobs.
- [ ] The production worker endpoint uses the same worker and indexing use cases.
- [ ] The production worker endpoint is protected by a server-only secret.
- [ ] Production scheduler setup is documented without committed secrets.
- [ ] `matchSiteChunks()` queries pgvector through Prisma rather than Supabase RPC.
- [ ] Retrieval results and current assistant-facing behaviour are preserved.
- [ ] RAG tests are focused and separated by responsibility.
- [ ] Required repository validation commands pass.
- [ ] Explicitly excluded work was not introduced.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

These tasks require local credentials, local Supabase, OpenAI access or production configuration. They must be handed to Freeman after automated implementation and independent review are complete.

1. Start local Supabase and apply all Prisma migrations to a clean local database.
2. Run the portfolio seed and confirm the five canonical source tables contain the expected records.
3. Run `index:source` in dry-run mode for one record from each source type and inspect the generated document, embedding input, hash and planned action.
4. Run a real full rebuild with a valid OpenAI key and inspect the resulting `site_chunks` rows.
5. Run the rebuild a second time and confirm it makes zero embedding calls.
6. Change a UI-only field such as project `featured` or `position` and confirm no indexing job or re-embedding is produced.
7. Change one semantic project field, run the worker and confirm only that project's chunk is updated.
8. Delete a source row, run the worker and confirm all of its chunks are removed.
9. Force one worker failure using a controlled invalid OpenAI configuration, then restore the configuration and confirm the preserved job succeeds on retry.
10. Ask the local assistant representative questions about profile, services, principles, experience and projects and inspect the returned sources.
11. Configure the production database URL, OpenAI key and worker secret in the deployment environment.
12. Configure the documented once-per-minute production scheduler with the deployed worker endpoint and secret.
13. Insert or update one safe production source record and confirm the queued job is processed automatically.

## Manual acceptance criteria

- [ ] A clean local database can be migrated, seeded and fully indexed from the source tables.
- [ ] Generated documents are readable and contain only the intended semantic fields.
- [ ] Running the full rebuild twice produces zero embedding calls on the second run.
- [ ] A UI-only update does not create unnecessary indexing work.
- [ ] A semantic update refreshes only the affected source chunks.
- [ ] Deleting a source removes its chunks and prevents stale retrieval.
- [ ] A failed job remains observable and succeeds after the failure is corrected.
- [ ] The assistant still retrieves useful profile, service, principle, experience and project context with working source links.
- [ ] Production source updates create jobs and update `site_chunks` automatically without a manual rebuild.
- [ ] Database, OpenAI and worker secrets are not exposed to the browser or committed to the repository.
