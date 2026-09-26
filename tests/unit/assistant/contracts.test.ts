import assert from "node:assert/strict";
import test from "node:test";

import { assistantRequestSchema, assistantStreamEventSchema } from "@/contracts/assistant.contract";

test("assistant request accepts the public payload and normalizes whitespace", () => {
  const result = assistantRequestSchema.parse({
    message: "  What has Freeman built?  ",
    previousResponseId: null,
    workflowInstanceId: "11111111-1111-4111-8111-111111111111",
  });

  assert.equal(result.message, "What has Freeman built?");
  assert.equal(result.previousResponseId, null);
  assert.equal(result.workflowInstanceId, "11111111-1111-4111-8111-111111111111");
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

test("deterministic Audit start accepts only the homepage Audit CTA origin", () => {
  const request = {
    message: "Start my audit",
    workflowStart: {
      workflowId: "audit",
      originPage: "/",
      originEntry: "home-audit-cta",
    },
  };

  assert.equal(assistantRequestSchema.safeParse(request).success, true);
  assert.equal(
    assistantRequestSchema.safeParse({
      ...request,
      workflowStart: { ...request.workflowStart, originPage: "/work" },
    }).success,
    false,
  );
  assert.equal(
    assistantRequestSchema.safeParse({
      ...request,
      workflowStart: { ...request.workflowStart, originEntry: "unknown-audit-cta" },
    }).success,
    false,
  );
});

test("assistant starter workflow starts accept only approved workflow and origin pairs", () => {
  for (const workflowStart of [
    {
      workflowId: "audit",
      originPage: "/",
      originEntry: "assistant-starter-audit",
    },
    {
      workflowId: "meeting-booking",
      originPage: "/",
      originEntry: "assistant-starter-meeting",
    },
    {
      workflowId: "contact",
      originPage: "/",
      originEntry: "assistant-starter-contact",
    },
  ]) {
    assert.equal(
      assistantRequestSchema.safeParse({ message: "Start", workflowStart }).success,
      true,
    );
  }

  for (const workflowStart of [
    {
      workflowId: "contact",
      originPage: "/",
      originEntry: "assistant-starter-audit",
    },
    {
      workflowId: "meeting-booking",
      originPage: "/work",
      originEntry: "assistant-starter-meeting",
    },
    {
      workflowId: "anything",
      originPage: "/",
      originEntry: "assistant-starter-anything",
    },
  ]) {
    assert.equal(
      assistantRequestSchema.safeParse({ message: "Start", workflowStart }).success,
      false,
    );
  }
});

test("assistant request rejects missing and oversized messages", () => {
  assert.equal(assistantRequestSchema.safeParse({}).success, false);
  assert.equal(assistantRequestSchema.safeParse({ message: " ".repeat(501) }).success, false);
  assert.equal(
    assistantRequestSchema.safeParse({ message: "Question", workflowInstanceId: "not-a-uuid" })
      .success,
    false,
  );
  const retiredTokenField = ["workflow", "Token"].join("");

  assert.equal(
    assistantRequestSchema.safeParse({ message: "Question", [retiredTokenField]: "retired" })
      .success,
    false,
  );
});

test("assistant stream contract accepts known events and rejects malformed events", () => {
  for (const event of [
    { type: "delta", delta: "hello" },
    { type: "sources", sources: [{ id: "source", title: "Project", url: "/work" }] },
    { type: "response_id", responseId: "resp_123" },
    {
      type: "workflow_instance",
      instance: {
        id: "11111111-1111-4111-8111-111111111111",
        workflowId: "meeting-booking",
        workflowVersion: 1,
        status: "active",
      },
    },
    { type: "done" },
    { type: "error", error: "Safe error" },
  ]) {
    assert.equal(assistantStreamEventSchema.safeParse(event).success, true);
  }

  assert.equal(
    assistantStreamEventSchema.safeParse({ type: "provider_error", message: "secret" }).success,
    false,
  );
  assert.equal(
    assistantStreamEventSchema.safeParse({
      type: "workflow_instance",
      instance: {
        id: "11111111-1111-4111-8111-111111111111",
        workflowId: "meeting-booking",
        workflowVersion: 1,
        status: "active",
        state: { email: "private@example.com" },
      },
    }).success,
    false,
  );
  assert.equal(
    assistantStreamEventSchema.safeParse({
      type: "workflow_instance",
      instance: {
        id: "11111111-1111-4111-8111-111111111111",
        workflowId: "meeting-booking",
        workflowVersion: 1,
        status: "active",
      },
      state: { email: "private@example.com" },
    }).success,
    false,
  );
});
