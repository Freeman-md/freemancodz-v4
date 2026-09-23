# Milestone 11: Tool-Calling Assistant Foundation

**Status:** Frozen
**Version:** 1.0.1  
**Last Updated:** 2026-08-03  
**Depends On:** Milestone 10  
**Target Pull Request:** —  
**Target Branch:** `feat/milestone-11-tool-calling-assistant`  
**Superseded By:** —

## Goal

Convert the current retrieval-first portfolio assistant into a manually orchestrated tool-calling assistant that lets the model respond conversationally, search the website when relevant, and exercise dummy meeting tools through the same validated execution loop while preserving the existing public streaming API.

## Required behaviour

### Assistant flow

Replace the mandatory flow:

```text
message → retrieve context → generate response
```

with:

```text
message → model chooses whether to call tools → application executes tools → model continues → final streamed response
```

- `AssistantService` owns the complete tool-calling loop.
- The model may respond without calling any tool.
- A greeting such as `hello` must not force website retrieval.
- The model may call one tool, several tools in one turn, or additional tools after receiving earlier tool outputs.
- Continue the loop until the model produces a completed response without unresolved tool calls.
- Add a small fixed maximum number of tool-call iterations. Exceeding it must fail safely rather than loop indefinitely.
- Preserve `previousResponseId` conversation continuity through the Responses API.
- Do not introduce the OpenAI Agents SDK or another orchestration framework.

### Initial tools

Expose these model-facing tools:

```text
search_website
find_meeting_slots
prepare_meeting
book_meeting
```

#### `search_website`

- This is the only real tool implementation in this milestone.
- Accept a clear search query generated from the user’s request.
- Create the query embedding through the existing `OpenAIProvider`.
- Retrieve results through the existing `SiteSearchService`.
- Return structured JSON containing the relevant chunks and source metadata required for grounded response generation.
- Preserve the retrieval behaviour established by Milestone 10. Do not add query rewriting outside the model-selected tool arguments, diversification, reranking, hybrid search or metadata filtering.
- Sources returned by successful website searches must be accumulated for the browser-facing `sources` stream event.

#### Dummy meeting tools

- `find_meeting_slots`, `prepare_meeting` and `book_meeting` must use dummy deterministic implementations.
- Each dummy tool must accept validated arguments and return explicit structured JSON.
- Dummy results must be realistic enough to verify multi-step tool orchestration, but must not contact Google Calendar, Supabase or any other external service.
- `prepare_meeting` must indicate that confirmation is required.
- `book_meeting` must not create external state. It may return a clearly marked dummy success result when called with valid dummy arguments.
- Production confirmation state, idempotency and write authorization are not part of this milestone. Do not present the dummy booking implementation as production-safe.

### Tool organisation

Use the existing assistant module and the following structure unless an equivalent repository-compliant name is demonstrably clearer:

```text
src/server/modules/assistant/
├── tools/
│   ├── assistant-tools.ts
│   ├── execute-assistant-tool.ts
│   ├── search-website.tool.ts
│   ├── find-meeting-slots.tool.ts
│   ├── prepare-meeting.tool.ts
│   └── book-meeting.tool.ts
└── schemas/
    └── tools/
        ├── search-website.schema.ts
        ├── find-meeting-slots.schema.ts
        ├── prepare-meeting.schema.ts
        └── book-meeting.schema.ts
```

- Keep tool declarations and execution dispatch at the root of `tools/`.
- Keep individual implementations in the same directory using the `.tool.ts` suffix.
- Use one Zod schema file per tool.
- `assistant-tools.ts` contains model-facing tool declarations only: names, descriptions and strict JSON parameter schemas.
- Individual `.tool.ts` files contain tool implementation logic only.
- `execute-assistant-tool.ts` parses raw arguments, validates them with the relevant schema, dispatches the implementation and returns a consistent structured result.
- Unknown tools, invalid JSON and invalid arguments must return controlled tool errors.
- Do not add `assistant-tool.interface.ts` or a generic tool class abstraction unless the implementation proves a concrete need that cannot be met clearly with functions and local types.

### OpenAI provider boundary

- Extend the current `OpenAIProvider` request contract so response generation can receive:
  - input compatible with user messages and tool outputs;
  - model-facing tool declarations;
  - instructions;
  - `previousResponseId`;
  - abort signal.
- The provider remains a thin wrapper around the OpenAI Responses API.
- It must not contain assistant orchestration, tool dispatch, argument validation or business logic.
- Preserve the existing embedding methods.
- Prefer one request object over a growing positional parameter list.

### Streaming

Preserve the existing route and browser-facing NDJSON event contract:

```text
delta
sources
response_id
error
done
```

- The chat route must remain responsible only for request parsing, validation, rate limiting and returning the stream.
- Stream model text deltas to the browser as they arrive.
- Buffer function-call arguments internally. Do not expose raw tool arguments or raw tool outputs as text deltas.
- After a model response requests tools, execute every completed tool call and submit the corresponding tool outputs in the next model request.
- Continue streaming text from subsequent model responses through the same `ReadableStream`.
- Accumulate unique website sources across all tool iterations and emit them through the existing `sources` event before completion.
- Emit the final usable response ID through the existing `response_id` event.
- Emit exactly one `done` event for a successful request.
- Preserve request cancellation. When the request signal is aborted, stop model iteration and tool execution as safely as possible and close the stream without leaking internal errors.
- Preserve the current public fallback and safe error behaviour. Internal tool or provider errors must not be exposed directly to visitors.

### Existing code disposition

Retain:

- `src/app/api/chat/route.ts` and its current HTTP responsibilities;
- the existing assistant request and stream contracts;
- rate limiting;
- `ReadableStream` and NDJSON transport;
- the shared `OpenAIProvider`;
- `SiteSearchService` and Milestone 10 retrieval behaviour;
- conversation continuity through `previousResponseId`;
- current logging and visitor-safe error messages.

Change:

- `AssistantService.createResponse()` into the manual tool-calling orchestration loop;
- the OpenAI response-generation provider contract to support tools and tool-output input items;
- the assistant system prompt so the model understands when each tool is appropriate and does not retrieve unnecessarily;
- assistant composition-root wiring for tool dependencies where required.

Move:

- the current `AssistantService.retrieveContext()` embedding and search behaviour into `search-website.tool.ts`.

Remove:

- mandatory retrieval before every model response;
- the early fallback that prevents the model from handling a message solely because retrieval returned no chunks;
- any superseded helper or type left unused by the new flow.

Do not retain duplicate retrieval paths or compatibility wrappers.

### Completion condition

This milestone is complete when the assistant can respond naturally without tools, use the real website-search tool for portfolio questions, complete dummy meeting-tool sequences through the same manual orchestration loop, and preserve the current streamed client experience.

## Constraints

- Implement the smallest complete manual tool-calling foundation.
- Keep orchestration inside the assistant module, not the route or OpenAI provider.
- Preserve the repository’s current module, interface, naming and composition-root conventions.
- Use plain functions for tool declarations, dispatch and implementations where classes add no value.
- Keep tool results structured and serialisable.
- Use strict tool argument schemas and server-side Zod validation. Do not trust model-generated arguments.
- Do not allow an unbounded tool loop.
- Do not redesign the frontend or public stream contract.
- Do not weaken rate limiting, request validation, error handling or abort handling.
- Do not expand this milestone into production booking safety or external integrations.
- Do not create speculative automated tests for behaviour that has not failed or stabilised.
- Prefer implementation review and manual verification for this milestone. Add automated coverage only when it protects a clear, valuable invariant or a confirmed regression.
- Avoid unrelated refactoring.

## Explicitly out of scope

- Google Calendar integration
- Google OAuth setup or token storage
- Supabase meeting persistence
- Real availability checks
- Real meeting creation
- Production booking confirmation state
- Booking idempotency, stale-slot protection or transaction design
- Generative UI
- Client-side tool status components
- MCP
- OpenAI Agents SDK
- LLM query expansion before the assistant call
- Retrieval redesign beyond moving the existing flow into a tool
- New tools beyond the four named in this contract
- Broad schema test suites
- End-to-end test infrastructure for the unfinished booking workflow
- Speculative edge-case coverage without an observed risk or failure
- Unrelated refactoring or future work

## Verification strategy

- Build the complete milestone behaviour first.
- Review the implementation directly against this contract, the repository architecture rules and the existing public stream contract.
- Use focused manual verification for conversational responses, website retrieval, dummy booking flow and browser streaming.
- Run the repository’s existing validation commands and existing relevant test suite.
- Do not add automated tests by default merely because a new file, schema or branch exists.
- Add a new automated test only when at least one of these is true:
  1. a real failure or regression was found during implementation or review;
  2. the behaviour is deterministic, isolated and important enough that manual verification would be repeatedly fragile;
  3. an existing test must be updated because an intentional contract changed.
- Regression tests should target the exact failure encountered and remain as small as possible.
- Do not build an end-to-end test suite for Google Calendar, Supabase or production booking behaviour in this milestone.

## Required tests

No new broad automated test suite is required by default.

The implementation agent must:

1. Run existing relevant assistant, route, client and repository validation commands.
2. Update existing tests only where the intentional tool-calling contract makes them stale.
3. Add the smallest focused regression test when a concrete failure is discovered during implementation or review.
4. Avoid speculative schema, orchestration permutation or end-to-end tests that do not protect an observed problem.

## Acceptance criteria

Include only criteria the implementation and review agents can verify from repository evidence, existing automated checks, implementation review or accessible runtime behaviour.

- [ ] Mandatory retrieval has been replaced by a manual model-directed tool-calling loop.
- [ ] The model can complete a conversational response without calling a tool.
- [ ] Website retrieval exists only through `search_website` within the assistant response flow.
- [ ] `search_website` uses the existing embedding provider and `SiteSearchService`.
- [ ] The three meeting tools are deterministic dummy implementations with structured results and no external writes.
- [ ] Tool declarations, implementations, executor and per-tool schemas follow the agreed organisation.
- [ ] Tool arguments are parsed and validated before implementation execution.
- [ ] Unknown tools and invalid arguments return controlled errors.
- [ ] The orchestration loop supports sequential and multiple tool calls and has a fixed iteration limit.
- [ ] The OpenAI provider remains a thin API wrapper and accepts tools and tool-output-compatible input.
- [ ] The route retains its existing HTTP-only responsibilities.
- [ ] The existing NDJSON event types remain compatible with the client.
- [ ] Text continues streaming across model iterations.
- [ ] Website sources are deduplicated and emitted through the existing `sources` event.
- [ ] Raw tool arguments and outputs are not exposed to visitors.
- [ ] Conversation continuity, cancellation, rate limiting and visitor-safe errors remain intact.
- [ ] No Google Calendar, OAuth, Supabase meeting storage, Generative UI, MCP or Agents SDK implementation was introduced.
- [ ] The implementation agent reviewed the final code against every required behaviour and constraint in this contract.
- [ ] Existing relevant tests and repository validation commands pass.
- [ ] Any newly discovered regression has the smallest useful regression test, or a clear reason is recorded when automated coverage would not provide value.
- [ ] No speculative broad schema, orchestration or end-to-end test suite was added.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

1. Run the assistant locally and verify these representative conversations:
   - `Hello`
   - `What projects has Freeman worked on?`
   - `I would like to book a meeting next week.`
2. Confirm the browser still renders streamed text and website sources correctly.
3. Confirm the booking conversation is visibly dummy behaviour and creates no external calendar event or database record.
4. Review the implementation against the required behaviour and acceptance criteria, then record any failures found before approval.

## Manual acceptance criteria

These are confirmed by the human after the workflow reaches `ready_for_human`. They do not block the agent workflow from reaching that state.

- [ ] A greeting receives a natural streamed response without unnecessary portfolio retrieval.
- [ ] A portfolio question produces a grounded answer with relevant visible sources.
- [ ] A booking request completes the intended dummy tool flow without creating external state.
- [ ] The existing assistant user experience remains stable enough to proceed to real booking workflow design.
- [ ] Manual review found no unresolved behaviour that requires a regression fix before the next milestone.
