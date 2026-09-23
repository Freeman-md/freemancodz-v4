# Milestone 8: Assistant Hook Separation and Smooth Streaming

**Status:** Frozen  
**Version:** 1.0.0  
**Last Updated:** 2026-08-01  
**Depends On:** Milestone 7  
**Target Pull Request:** —  
**Target Branch:** `feat/milestone-8-assistant-streaming`  
**Superseded By:** —

## Goal

Split the current assistant Hook into one Hook for conversation and streaming behaviour and one Hook for floating-panel interaction behaviour, while making streamed text appear progressively instead of arriving in abrupt visual jumps.

## Required behaviour

- Keep `src/features/assistant/hooks/useAssistant.ts` responsible for assistant conversation behaviour: input, messages, loading, errors, previous response ID, message submission, backend communication, stream events and final response state.
- Add `src/features/assistant/hooks/useFloatingPanel.ts` for floating-panel behaviour: opening and closing, launcher/conversation presentation state, focus, outside-click handling, Escape handling, automatic scrolling, reduced-motion behaviour, element refs and panel transitions.
- Keep coordination simple. `FloatingPortfolioChat` may compose both Hooks and pass the assistant state or callbacks required by `useFloatingPanel`; neither Hook should duplicate the other Hook's state.
- Preserve the existing global open-assistant event. Panel opening belongs to `useFloatingPanel`; submitting an optional event message must delegate to the submission operation returned by `useAssistant`.
- Add a small client-side pacing buffer to `useAssistant` so incoming text deltas are received immediately but revealed to the message state in small, frequent chunks.
- Use a simple adaptive reveal rate so a small backlog appears smoothly and a larger backlog catches up quickly. Do not create a strict slow character-by-character typewriter effect.
- Drain all buffered text before the request is considered visually complete. The final displayed response must exactly match the text received from the stream.
- Clear pending buffered text and scheduled reveal work when the request fails, is cancelled or the component unmounts.
- Respect reduced-motion preference. When reduced motion is enabled, append received deltas immediately without paced animation.
- Keep `stream-assistant-response.ts`, the server stream contract and `AssistantService` unchanged unless a minimal type or callback adjustment is required by the Hook split.
- Keep one-use pacing helpers private to `useAssistant.ts`. Do not create a new service, abstraction, dependency or general-purpose animation module.

## Constraints

- Preserve current assistant submission, follow-up response IDs, source attachment, error replacement, loading state and message ordering.
- Preserve opening from the launcher, opening from the global event, focus behaviour, outside-click closing, Escape closing, automatic scrolling and panel animation.
- Do not delay, batch or throttle OpenAI events on the server.
- Do not introduce an artificial delay after all buffered text has been rendered.
- Do not add a state library, stream library, animation dependency or additional architectural layer.
- Follow `.agents/skills/nextjs-architecture/SKILL.md` and keep both Hooks inside `src/features/assistant/hooks`.
- Implement the smallest complete change.

## Explicitly out of scope

- Backend service, provider, contract or Route Handler refactoring
- Changes to prompts, retrieval, citations, models or response content
- New assistant UI, visual redesign or copy changes
- A configurable typing-speed settings system
- Word-by-word reconstruction or modification of streamed text
- Unrelated frontend refactoring or future work

## Required tests

1. `useAssistant` preserves message submission and all existing stream-event behaviour.
2. Rapid text deltas are revealed progressively, then produce the exact complete response without missing, duplicated or reordered text.
3. Reduced-motion mode appends deltas immediately.
4. Failure, cancellation and unmount cleanup stop pending reveal work and preserve current safe error behaviour.
5. `useFloatingPanel` preserves opening, closing, focus, Escape, outside-click, scrolling and global event behaviour.
6. Existing tests remain green, and `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.

## Acceptance criteria

Include only criteria the implementation and review agents can verify from repository evidence, automated tests, CI or accessible runtime behaviour.

- [ ] `useAssistant.ts` owns conversation, backend communication and streaming state only.
- [ ] `useFloatingPanel.ts` owns floating-panel and browser interaction behaviour only.
- [ ] `FloatingPortfolioChat` composes the two Hooks without duplicated state or circular dependencies.
- [ ] Streamed text is displayed progressively through a small client-side buffer.
- [ ] The final displayed response exactly matches the received stream text.
- [ ] Reduced-motion mode bypasses paced text reveal.
- [ ] Pending pacing work is cleaned up on failure, cancellation and unmount.
- [ ] Existing assistant behaviour remains intact.
- [ ] No server-side stream delay or unrelated abstraction was introduced.
- [ ] Explicitly excluded work was not introduced.
- [ ] Focused tests pass.
- [ ] Repository validation commands pass.
- [ ] The complete independent review is posted to the pull request.
- [ ] The pull request is not merged by an agent.

## Manual tasks

None.

## Manual acceptance criteria

- [ ] The streamed response feels smooth and natural at normal response lengths without appearing unnecessarily slow.
