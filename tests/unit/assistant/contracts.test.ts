import assert from "node:assert/strict";
import test from "node:test";

import { assistantRequestSchema, assistantStreamEventSchema } from "@/contracts/assistant.contract";

test("assistant request accepts the public payload and normalizes whitespace", () => {
  const result = assistantRequestSchema.parse({
    message: "  What has Freeman built?  ",
    previousResponseId: null,
  });

  assert.equal(result.message, "What has Freeman built?");
  assert.equal(result.previousResponseId, null);
});

test("assistant request recovers from malformed previous response IDs", () => {
  for (const previousResponseId of ["", "  ", "response_1", "resp_" + "x".repeat(201)]) {
    assert.equal(
      assistantRequestSchema.parse({ message: "Question", previousResponseId }).previousResponseId,
      null,
    );
  }

  assert.equal(
    assistantRequestSchema.parse({ message: "Question", previousResponseId: " resp_123 " })
      .previousResponseId,
    "resp_123",
  );
});

test("assistant request rejects missing and oversized messages", () => {
  assert.equal(assistantRequestSchema.safeParse({}).success, false);
  assert.equal(assistantRequestSchema.safeParse({ message: " ".repeat(501) }).success, false);
});

test("assistant stream contract accepts known events and rejects malformed events", () => {
  for (const event of [
    { type: "delta", delta: "hello" },
    { type: "sources", sources: [{ id: "source", title: "Project", url: "/work" }] },
    { type: "response_id", responseId: "resp_123" },
    { type: "done" },
    { type: "error", error: "Safe error" },
  ]) {
    assert.equal(assistantStreamEventSchema.safeParse(event).success, true);
  }

  assert.equal(
    assistantStreamEventSchema.safeParse({ type: "provider_error", message: "secret" }).success,
    false,
  );
});
