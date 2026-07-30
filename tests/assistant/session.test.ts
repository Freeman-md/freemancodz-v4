import assert from "node:assert/strict";
import test from "node:test";

import { appendAssistantDelta, attachAssistantSources, replaceAssistantWithError, stageWhenOpening } from "@/features/assistant/state/assistant-conversation";

const messages = [{ id: "user", role: "user" as const, content: "Question" }, { id: "assistant", role: "assistant" as const, content: "" }];

test("assistant session updates only the active response for deltas, sources, and failures", () => {
  const withDelta = appendAssistantDelta(messages, "assistant", "Answer");
  assert.deepEqual(withDelta.map((message) => message.content), ["Question", "Answer"]);
  const sources = [{ id: "work", title: "Work", url: "/work" }];
  const withSources = attachAssistantSources(withDelta, "assistant", sources);
  assert.deepEqual(withSources[1]?.sources, sources);
  const failed = replaceAssistantWithError(withSources, "assistant", { id: "temporary", role: "assistant", content: "Safe failure", error: true });
  assert.deepEqual(failed, [messages[0], { id: "assistant", role: "assistant", content: "Safe failure", error: true }]);
});

test("assistant session restores the composer or conversation when opened", () => {
  assert.equal(stageWhenOpening([]), "composer");
  assert.equal(stageWhenOpening(messages), "conversation");
});
