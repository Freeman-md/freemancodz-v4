# Milestone 9: Focused Testing Structure and Assistant Evaluation

**Status:** Frozen
**Version:** 1.0.0  
**Last Updated:** 2026-08-01  
**Depends On:** Milestone 8  
**Target Pull Request:** —  
**Target Branch:** `feat/milestone-9-focused-testing`  
**Superseded By:** —

## Goal

Reorganise the existing test suite into clear unit, integration and evaluation layers, remove tests that are unnecessarily large or unclear, and add only the nine agreed assistant scenarios needed to protect critical behaviour without changing application behaviour.

## Required behaviour

- Reorganise the existing deterministic tests under:

```text
tests/
├── unit/
│   ├── assistant/
│   ├── portfolio/
│   └── search-index/
├── integration/
│   └── assistant/
└── evals/
    └── assistant/
```

- Move existing focused assistant, portfolio and search-index tests into the appropriate `tests/unit` location. Update imports and package commands without duplicating tests solely because their paths change.
- Review every existing test before retaining it. Keep a test only when it protects a critical behaviour, an agreed failure case or a real regression. Remove tests that mainly assert implementation details, speculative edge cases, file layout, internal wiring or broad rendering behaviour with little practical value.
- Review the current assistant `render.test.tsx`. It must not remain as an approximately 700-line broad rendering suite. Delete it when its behaviour is already protected elsewhere or manually verifiable. If one critical rendering regression still requires automation, replace it with one substantially smaller and focused test covering only that behaviour.
- Add deterministic assistant integration coverage under `tests/integration/assistant`. Prefer one `assistant.test.ts` file. Split it into a small number of files only when the scenarios form genuinely separate responsibilities and the split makes the suite easier to understand.
- Integration tests must exercise the public assistant boundary and the composed application flow using controlled fakes for OpenAI, retrieval and other external effects. They must not call the live OpenAI API.
- Cover exactly these nine agreed scenarios across integration tests and evals:
  1. Direct portfolio question
  2. Follow-up question
  3. Multiple relevant sources
  4. No relevant sources
  5. Retrieval failure
  6. OpenAI streaming failure
  7. Aborted request
  8. Invalid public request
  9. Rate-limited request
- Do not create additional assistant scenarios. Several assertions may belong to one scenario, but one scenario must not be expanded into many speculative cases.
- Use integration tests for the deterministic behaviour of all nine scenarios. For direct and follow-up questions, integration tests must verify the request, retrieval, stream events, sources and response-ID flow without judging the wording quality of model-generated prose.
- Keep failure expectations simple: retrieval and OpenAI failures return the current safe error behaviour, aborts stop cleanly, invalid public requests return the expected validation response, and rate-limited requests return the expected limit response.
- Add a small opt-in assistant eval suite under `tests/evals/assistant`. Evals must use the real assistant prompt and configured model against controlled portfolio content or a known retrieval dataset.
- Use only the already agreed scenarios for evals:
  - the direct portfolio question for answer relevance, grounding and source support;
  - the follow-up question for conversation continuity and grounding;
  - the multiple relevant sources and no relevant sources scenarios for retrieval quality and correct abstention or fallback behaviour.
- Do not invent additional eval prompts. Store the exact approved direct question, follow-up question and retrieval inputs in one small eval fixture so the questions remain stable and easy to review.
- Keep the eval rubric short and observable. Measure only:
  - relevance to the question;
  - grounding in the supplied portfolio content;
  - absence of unsupported claims;
  - alignment between the answer and returned sources;
  - follow-up continuity;
  - retrieval relevance for the known source set; and
  - correct no-result behaviour.
- Prefer simple pass/fail checks or a minimal documented score. Do not introduce a large evaluation framework unless the existing tools cannot run the agreed evals clearly without one.
- Add or update package commands so:
  - `test:unit` runs unit tests;
  - `test:integration` runs deterministic integration tests;
  - `test` runs unit and integration tests;
  - `eval:assistant` runs the live assistant evals explicitly.
- Exclude live evals from the default `npm test` command and normal deterministic CI because they use external services, cost money and may vary between runs.
- Keep test helpers small and local. Share a helper only when it removes clear duplication across several tests without hiding the scenario setup.
- Document the project testing principle in the smallest existing appropriate location: automate critical flows and agreed failures, add regression tests for real bugs, use manual checks where they are clearer, and do not pursue a coverage percentage target.

## Constraints

- Preserve all application behaviour. This milestone changes test organisation and coverage only.
- Keep the implementation proportional to a personal portfolio application.
- Do not add scenarios beyond the nine listed in this contract.
- Do not turn each scenario into its own file unless the separation is genuinely necessary.
- Do not test private methods, exact internal calls, class construction, file layout or other implementation details.
- Do not add speculative edge cases merely to increase coverage.
- Do not add broad snapshot tests or large DOM harnesses when a focused assertion or manual check is clearer.
- Do not require live OpenAI, production data or network access for unit or integration tests.
- Do not introduce a coverage target.
- Do not add a new test or eval framework unless the current Node test and `tsx` setup cannot express the required behaviour simply.
- Keep each retained or new test understandable without tracing a large shared abstraction.
- Follow the regression-driven approach: add future tests primarily when protecting a critical user flow, an agreed failure case or a real bug that has occurred.

## Explicitly out of scope

- Fixing the ingestion, chunking or embedding pipeline
- Changing stored records, embeddings or database schema
- Improving retrieval algorithms or removing chunk diversification
- Changing assistant prompts, response behaviour or streaming behaviour
- Adding agent actions such as booking calls
- Adding browser end-to-end infrastructure or a large UI test suite
- Updating the reusable AI workflow in this repository or the separate `ai-workflow` repository
- New assistant questions, eval prompts or failure scenarios
- Unrelated refactoring or future work

## Required tests

1. Existing high-value assistant, portfolio and search-index unit tests pass from their new `tests/unit` locations.
2. Deterministic assistant integration coverage verifies exactly the nine agreed scenarios without live external services.
3. The assistant eval command runs only the agreed direct, follow-up, multiple-source and no-source quality checks using the documented rubric.
4. The reduced or replacement rendering coverage protects only a clearly identified critical behaviour; the existing oversized `render.test.tsx` does not remain unchanged.
5. `npm run test:unit`, `npm run test:integration`, `npm test` and `npm run eval:assistant` resolve to the intended suites, with live evals excluded from `npm test`.
6. Existing tests remain green, and repository validation commands pass.

## Acceptance criteria

Include only criteria the implementation and review agents can verify from repository evidence, automated tests, CI or accessible runtime behaviour.

- [ ] Existing tests are organised under clear `unit`, `integration` and `evals` directories.
- [ ] Retained tests protect critical behaviour, agreed failures or known regressions rather than implementation details.
- [ ] The oversized assistant `render.test.tsx` has been removed or replaced with substantially smaller focused coverage.
- [ ] The integration suite covers exactly the nine agreed scenarios and does not introduce additional scenarios.
- [ ] Evals use only the agreed direct, follow-up, multiple-source and no-source scenarios and the short documented rubric.
- [ ] Unit and integration tests remain deterministic and do not call live external services.
- [ ] Live assistant evals are explicit and excluded from the default `npm test` command.
- [ ] The test code remains small, readable and proportionate to the application.
- [ ] Relevant existing behaviour remains intact.
- [ ] Explicitly excluded work was not introduced.
- [ ] Focused tests pass.
- [ ] Repository validation commands pass.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

1. Start the application locally using the normal development command.
2. Open the portfolio page and open the assistant.
3. Submit the exact direct portfolio question stored in the eval fixture.
4. Confirm the assistant returns a relevant portfolio-grounded answer and displays the expected supporting source or sources.
5. Submit the exact follow-up question stored in the eval fixture.
6. Confirm the answer continues the same conversation and remains grounded in the portfolio information.
7. Submit the exact no-relevant-sources input stored in the eval fixture.
8. Confirm the assistant uses the current safe fallback or abstention behaviour and does not invent portfolio facts.
9. Send an invalid request to `/api/chat` using browser developer tools or `curl`.
10. Confirm the endpoint returns the expected safe validation response and the interface does not break.

## Manual acceptance criteria

These are confirmed by the human after the workflow reaches `ready_for_human`. They do not block the agent workflow from reaching that state.

- [ ] The direct portfolio question returns a relevant grounded answer with appropriate sources.
- [ ] The follow-up question continues the conversation correctly.
- [ ] The no-relevant-sources question produces the expected safe fallback without unsupported claims.
- [ ] An invalid public request produces the expected safe validation response.
- [ ] The remaining automated test suite feels understandable and proportionate when reviewed.
