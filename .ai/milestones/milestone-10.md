# Milestone 10: Search Index Foundation

**Status:** Frozen  
**Version:** 1.0.0  
**Last Updated:** 2026-08-01  
**Depends On:** Milestone 9  
**Target Pull Request:** —  
**Target Branch:** `feat/milestone-10-search-index-foundation`  
**Superseded By:** —

## Goal

Simplify and correct the search-index pipeline so every supported portfolio record is converted into clear source-specific text, split into deterministic chunks when necessary, embedded consistently, stored correctly, and retrieved directly from the embedded user message without diversification or query rewriting.

## Required behaviour

### Current problem

- The assistant now embeds only the user’s current message.
- The previous diversification step has already been removed and must remain removed.
- Retrieval is still incorrect for direct portfolio questions. For the question `What projects has Freeman worked on?`, generic `About Freeman` profile chunks currently rank above project records.
- The assistant can still produce a plausible answer when a project was mentioned in an earlier response, but that conversation history can mask the fact that the current retrieval returned no relevant project record.
- The current project mapper creates one document containing labelled database fields, but the embedded text does not clearly identify the record as one of Freeman’s projects.
- The current pipeline does not perform a real text-chunking step. Most source mappers return one document with `documentIndex: 0`, and `site-chunk.factory.ts` only formats, hashes and identifies that document.
- Several content-block records use the same generic title, `About Freeman`, which gives multiple similar profile rows nearly identical retrieval signals.
- The current `models/search-index.ts` file mixes queue, retrieval, source, chunk and result types without clear ownership.
- The goal of this milestone is to repair the indexing foundation, not to compensate for it with post-retrieval logic.

### Required simplified architecture

Use the existing `src/server/modules/search-index` module, but reduce it to the smallest clear set of responsibilities:

```text
src/server/modules/search-index/
├── public.ts
├── interfaces/
│   ├── search-index.service.interface.ts
│   ├── site-search.service.interface.ts
│   ├── source-record.repository.interface.ts
│   ├── search-index-job.repository.interface.ts
│   └── site-chunk.repository.interface.ts
├── services/
│   ├── search-index.service.ts
│   └── site-search.service.ts
├── repositories/
│   ├── source-record.repository.ts
│   ├── search-index-job.repository.ts
│   └── site-chunk.repository.ts
├── mappers/
│   ├── source-document.mapper.ts
│   └── content-block-document.mapper.ts
└── chunking/
    └── text-chunker.ts
```

Create only the files that are required by the final implementation. Equivalent names are acceptable when they follow the repository naming standard and make the responsibility clearer.

- `SearchIndexService` owns the write pipeline:
  - process pending jobs;
  - index one source;
  - remove one source;
  - rebuild the complete index;
  - report job status.
- `SiteSearchService` owns retrieval only:
  - accept a query embedding;
  - return the raw top matching chunks from `site_chunks` in similarity order;
  - perform no diversification, reranking, query rewriting or result grouping.
- `SourceRecordRepository` loads supported records from `content_blocks`, `projects`, `services`, `principles` and `experiences`.
- `SearchIndexJobRepository` owns the single `search_index_jobs` table.
- `SiteChunkRepository` owns chunk persistence, complete source replacement and vector matching.
- Pure source mapping and text chunking remain functions. Do not create services, providers or interfaces for pure deterministic transformations.
- Keep only interfaces required by the repository architecture standard and useful test seams. Do not retain interfaces solely because matching files already exist.
- Remove the miscellaneous `models/search-index.ts` type bag. Move types beside the service, repository, mapper or chunker that owns them.

### Source record to text mapping

- Introduce one clear canonical document shape used by every supported source mapper. It should contain only the information needed for indexing, such as:

```ts
type IndexDocument = {
  sourceType: IndexableSourceType;
  sourceId: string;
  title: string;
  category: string;
  url: string;
  keywords: string[];
  paragraphs: string[];
};
```

- Map every supported database record into natural, meaningful text that reflects how a user would ask about it.
- Start each mapped record with an explicit subject statement. Examples:
  - `Project: Creator Lab. Freeman built ...`
  - `Experience: Freeman worked as ...`
  - `Service: Freeman offers ...`
  - `Profile: Freeman ...`
- Project documents must explicitly contain the terms `Project` and `Freeman` in meaningful sentences. Do not rely only on a project title, category or generic labels such as `Summary` and `Role`.
- Include relevant non-empty fields only. Do not embed record IDs, timestamps, raw JSON, URLs or unrelated operational metadata.
- Preserve useful project detail such as summary, role, outcome, implementation detail, collaboration, future direction, positioning and technologies.
- Map every known content-block key explicitly.
- Do not give several unrelated content blocks the same generic title. Each indexed content block must receive a stable descriptive title and keywords that identify its actual subject.
- Every record in a supported source table must produce at least one index document. A supported source that produces no document is an indexing failure and must be logged and failed. Do not silently delete its previous chunks and complete the job.
- If a source table contains records that should never be indexed, remove that table or record category from the supported trigger and mapper scope rather than silently returning an empty document list.

### Deterministic text chunking

- Add one small pure text chunker.
- The chunker must work from the mapped document paragraphs, not directly from raw database records.
- Use a simple deterministic character-based limit. Start with a maximum of approximately 1,200 characters per chunk.
- Preserve complete paragraphs whenever they fit.
- Group consecutive paragraphs until adding another paragraph would exceed the limit.
- If one paragraph exceeds the limit, split it at sentence boundaries. If a sentence still exceeds the limit, split it at word boundaries.
- Do not use tokenizers or add a new dependency for this milestone.
- Do not add overlapping chunks in this milestone. Overlap would create additional near-duplicate results before the basic retrieval quality is understood.
- Short records should normally produce one chunk.
- Longer records may produce several ordered chunks.
- Never create empty or whitespace-only chunks.
- Assign deterministic zero-based `chunkIndex` values from the final chunk order.
- Keep the existing deterministic ID shape or an equivalent stable form:

```text
<sourceType>:<sourceId>:<chunkIndex>
```

- Every chunk must retain the source title, category, URL, keywords, source type and source ID.
- Build the embedding input consistently for every chunk. Include:
  - record type;
  - title;
  - category;
  - keywords;
  - chunk text.
- The text stored in `site_chunks.content` must be the same meaningful chunk text used as the content portion of the embedding input.
- Add a small indexing-format version constant to the content-hash input. Changing the mapper or chunker version must invalidate old hashes without adding irrelevant version text to the embedding itself.

### Indexing and unchanged-record behaviour

Use a source-level replacement algorithm rather than maintaining separate created and changed lists for individual chunks:

1. Load the current source record.
2. Map it into the canonical index document.
3. Produce deterministic chunks.
4. Prepare the final embedding inputs and content hashes.
5. Load the existing chunk indexes, hashes and embedding models for that source.
6. If the ordered chunks have the same indexes, hashes and embedding model, skip embedding and persistence for the source.
7. If anything differs, generate embeddings for every new chunk for that source.
8. Replace all chunks for that source in one database transaction.
9. If the source was deleted, delete all chunks for that source.

This deliberately re-embeds all chunks belonging to one changed source. The portfolio is small, and this simpler behaviour is preferred over complex per-chunk reconciliation.

- Validate that the embedding provider returns exactly one embedding for every input.
- Validate the expected vector length before persistence.
- Store the content hash, embedding model and embedded timestamp for every chunk.
- Preserve the existing unique protection on `sourceType`, `sourceId` and `chunkIndex`.
- A failed mapping, chunking, embedding or persistence operation must fail the indexing job and preserve the previous complete indexed source where possible.
- Do not partially replace a source. Complete replacement must be transactional.

### Queue and cron flow

- Retain the existing database triggers on the supported source tables.
- Retain the single `search_index_jobs` table.
- Retain the existing scheduled worker route and its authorization behaviour.
- Merge the current `SearchIndexWorkerService` behaviour into `SearchIndexService.processPendingJobs()` and remove the separate worker service and interface.
- The scheduled route and local worker entrypoint should call the same `SearchIndexService` method.
- Retain basic claim, completion, failure and retry behaviour.
- Do not redesign queue throughput, scheduling frequency, distributed locking or retry policy in this milestone.
- Remove the programmatic `enqueue()` repository method and its types when it is not used outside the database trigger workflow.

### Retrieval flow

- Keep query embedding exactly as:

```ts
const embedding = await this.openai.createEmbedding(message);
```

- The assistant must depend on `SiteSearchService`, not on the indexing orchestration service.
- `SiteSearchService` must return the raw top six vector matches ordered by similarity.
- Keep the current vector similarity function and initial threshold unless the implementation finds a verified correctness defect in them.
- Do not add diversification.
- Do not add an LLM query-rewriting or expansion step.
- Do not add metadata filtering, keyword search, hybrid search, reranking or intent classification.
- Remove the temporary `console.log(chunks)` from `AssistantService` before completion.
- Retrieval verification must inspect the chunks returned before response generation so conversation history cannot hide a failed retrieval.

### Existing code disposition

Retain:

- source-table triggers;
- `search_index_jobs`;
- `site_chunks` and its vector column;
- the `match_site_chunks` database function;
- the shared `OpenAIProvider`;
- the composition root;
- the scheduled internal worker route;
- current safe logging and failure handling;
- the one-source preview, rebuild and status capabilities;
- transactional chunk persistence.

Simplify or replace:

- `SearchIndexService` orchestration;
- current source mapper dispatch;
- project, experience, service, principle and content-block text construction;
- current created, changed, unchanged and obsolete per-chunk reconciliation;
- current preview output so it shows the final mapped text, deterministic chunks, hashes and expected source action;
- type ownership currently concentrated in `models/search-index.ts`;
- composition-root dependencies after separating indexing from retrieval.

Remove after replacements are working:

- `services/search-index-worker.service.ts`;
- `interfaces/search-index-worker.service.interface.ts`;
- `factories/site-chunk.factory.ts`;
- `models/search-index.ts`;
- superseded mapper files and barrels;
- unused queue enqueue code and types;
- any remaining diversification code;
- temporary retrieval logging.

Do not keep compatibility wrappers or duplicate old and new pipeline implementations.

### Clean re-index process

Update the existing rebuild command to support an explicit clean rebuild mode for local and production environments.

Recommended commands:

```bash
npm run index:rebuild -- --clean
npm run index:rebuild:production -- --clean
```

Equivalent command names are acceptable if they remain obvious and documented.

Clean rebuild behaviour:

1. Require the existing explicit production confirmation for production execution.
2. Print the target environment and source-record counts before destructive work.
3. Delete all rows from `site_chunks`.
4. Clear existing indexing jobs so stale pending or processing work cannot alter the freshly rebuilt index afterward.
5. Enumerate every current record from the supported source tables.
6. Run every record through the same mapper, chunker, embedding and persistence path used by normal jobs.
7. Report:
   - source records discovered;
   - sources indexed;
   - sources skipped;
   - chunks created;
   - embeddings generated;
   - sources failed.
8. Exit with a non-zero status when any source fails.
9. Leave the database with no stale pending or processing jobs and a complete index derived from the current source tables.

The clean rebuild must not maintain a second shadow index or add deployment infrastructure. It is an explicit maintenance operation for a small portfolio database.

### Completion condition

This milestone is complete when the simplified pipeline has been implemented, all supported local records have been cleanly re-indexed, retrieval for the existing direct project question returns project chunks before response generation, and the repository is ready for the user to run the same clean rebuild in production.

## Constraints

- Implement the smallest complete indexing and retrieval foundation.
- Keep the design proportional to a low-traffic personal portfolio website.
- Preserve the current supported source tables unless a table is proven not to contain indexable portfolio information.
- Preserve current assistant streaming, response generation, conversation continuity and public API behaviour.
- Do not change the assistant answer using conversation history to compensate for missing retrieval.
- Do not preserve an abstraction merely because it already exists.
- Do not create an interface, class, model or folder for a pure transformation that is clearer as a function and local type.
- Do not add a tokenizer, queue library, orchestration framework, vector database or evaluation framework.
- Keep tests focused on the mapping, chunking, source replacement and observed retrieval regression.
- Do not generate a large new test suite. Add only the smallest tests needed to protect this pipeline.

## Explicitly out of scope

- Reintroducing diversification
- LLM-based query rewriting or expansion
- Deterministic query expansion beyond the current user message
- Hybrid vector and keyword search
- Full-text search
- Metadata filters based on inferred question intent
- Cross-encoder reranking
- A second embedding model
- Changing the response-generation model or assistant system prompt
- Agent actions such as booking calls
- Queue throughput or cron-frequency changes
- Distributed workers or new infrastructure
- Portfolio content rewriting unrelated to producing faithful index text
- A new database or vector store
- Unrelated refactoring or future work

## Required tests

1. Source-mapper tests verify that every supported record type produces meaningful source-specific text and that project text explicitly identifies the record as a Freeman project.
2. Content-block mapper tests verify that known blocks receive stable descriptive titles and that unsupported or invalid supported records fail visibly rather than producing an empty successful result.
3. Text-chunker tests cover one short document, one multi-paragraph document, one oversized paragraph and deterministic repeat output. Do not expand this into speculative boundary permutations.
4. Indexing-service tests verify:
   - an unchanged source does not request new embeddings or write chunks;
   - a changed source embeds all of its new chunks and replaces the source transactionally;
   - a deleted source removes its chunks;
   - mapping, embedding and persistence failures fail the job safely.
5. Clean-rebuild tests verify that old chunks and stale jobs are cleared, all current sources use the normal indexing path, failures produce a non-zero outcome, and summary counts are accurate.
6. The existing direct portfolio eval for `What projects has Freeman worked on?` inspects retrieved chunks before response generation. Do not add a new LLM prompt solely for this milestone.
7. Existing unit, integration and eval commands remain valid and existing tests remain green.

## Acceptance criteria

Include only criteria the implementation and review agents can verify from repository evidence, automated tests, CI or accessible runtime behaviour.

- [ ] The final module has separate indexing and retrieval services with clear responsibilities.
- [ ] The separate search-index worker service has been removed and pending-job processing is owned by the indexing service.
- [ ] Every supported source record produces meaningful source-specific text or fails visibly.
- [ ] Project embedding text explicitly identifies each record as one of Freeman’s projects.
- [ ] Repeated content blocks no longer rely on the same generic `About Freeman` title when their subjects differ.
- [ ] Longer source text is split by the deterministic paragraph-first chunker.
- [ ] Short source text remains one chunk.
- [ ] Chunk IDs, indexes and hashes are deterministic.
- [ ] An unchanged source performs no embedding or chunk write.
- [ ] A changed source replaces all of its chunks transactionally.
- [ ] Embedding counts and vector lengths are validated before persistence.
- [ ] The miscellaneous `models/search-index.ts` type bag and superseded factory and mapper files are removed.
- [ ] Retrieval embeds only the current user message and returns raw similarity-ranked results.
- [ ] No diversification or query-rewriting implementation exists.
- [ ] Clean local and production rebuild commands are available with production safeguards.
- [ ] A clean rebuild reports source, chunk, embedding and failure counts and exits unsuccessfully when any source fails.
- [ ] The existing direct project eval inspects retrieval before response generation.
- [ ] Focused tests pass.
- [ ] Repository validation commands pass.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

1. Run the clean local rebuild:

```bash
npm run index:rebuild -- --clean
```

2. Confirm the command reports every supported source, creates chunks, generates embeddings and reports zero failures.
3. Inspect local `site_chunks` and confirm:
   - every project record has at least one chunk;
   - every chunk has a non-empty title, content, content hash, embedding model and embedded timestamp;
   - chunk indexes are unique within each source;
   - project chunks contain clear project-specific text;
   - repeated profile chunks have distinct meaningful titles where their subjects differ.
4. Start a completely new assistant conversation with no previous response ID.
5. Ask exactly:

```text
What projects has Freeman worked on?
```

6. Inspect the six retrieved chunks before response generation. Confirm the first result is a project and at least four of the first six results are project records. Confirm the result is not dominated by generic `About Freeman` profile chunks.
7. In a new conversation, ask exactly:

```text
Can you elaborate on Pay4Me?
```

8. Confirm the Pay4Me project chunk is the first or clearly highest relevant retrieved source before response generation.
9. Confirm the assistant answer and visible sources are grounded in those retrieved chunks rather than information carried only through previous conversation history.
10. After local approval and deployment, run the clean production rebuild:

```bash
npm run index:rebuild:production -- --clean
```

11. Repeat the same database checks and fresh-conversation retrieval checks against production.

## Manual acceptance criteria

These are confirmed by the human after the workflow reaches `ready_for_human`. They do not block the agent workflow from reaching that state.

- [ ] The clean local rebuild completes with zero failed sources.
- [ ] All local portfolio records expected to be searchable have valid chunks and embeddings.
- [ ] `What projects has Freeman worked on?` retrieves project records directly in a fresh conversation.
- [ ] At least four of the first six matches for the direct project question are project records, with a project as the first match.
- [ ] `Can you elaborate on Pay4Me?` retrieves the Pay4Me project directly.
- [ ] The assistant no longer appears correct only because prior conversation history supplies missing project information.
- [ ] The clean production rebuild completes with zero failed sources.
- [ ] The production retrieval results match the approved local behaviour.
- [ ] The final pipeline is understandable enough to explain as: source record → mapped document → deterministic chunks → embeddings → transactional replacement → raw vector retrieval.
