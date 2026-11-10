import assert from "node:assert/strict";
import test from "node:test";

import { assistantRequestSchema, assistantStreamEventSchema } from "@/contracts/assistant.contract";
import { assistantChoiceSchema } from "@/contracts/assistant-choice.contract";

test("booking actions cannot carry messages or editable details", () => {
  const action = {
    action: "confirm_booking",
    workflowInstanceId: "11111111-1111-4111-8111-111111111111",
    expectedRevision: 3,
  };

  assert.deepEqual(assistantRequestSchema.parse(action), action);
  assert.equal(
    assistantRequestSchema.safeParse({
      action: "retry_booking",
      workflowInstanceId: action.workflowInstanceId,
    }).success,
    true,
  );
  for (const invalid of [
    { ...action, expectedRevision: -1 },
    { ...action, expectedRevision: 1.5 },
    { ...action, expectedRevision: undefined },
    { ...action, message: "yes" },
    { ...action, email: "different@example.com" },
    { ...action, workflowStart: {} },
    { ...action, workflowInstanceId: "invalid" },
    {
      action: "retry_booking",
      workflowInstanceId: action.workflowInstanceId,
      expectedRevision: 3,
    },
  ]) {
    assert.equal(assistantRequestSchema.safeParse(invalid).success, false);
  }
});

test("choices validate bounded unique strings and reject hidden operations", () => {
  const choice = {
    question: "What next?",
    options: ["Continue my audit", "Cancel my audit and start a message"],
  };

  assert.deepEqual(assistantChoiceSchema.parse(choice), choice);
  for (const invalid of [
    { ...choice, question: " " },
    { ...choice, question: "q".repeat(501) },
    { ...choice, options: ["One"] },
    { ...choice, options: Array.from({ length: 7 }, (_, i) => String(i)) },
    { ...choice, options: ["One", " one "] },
    { ...choice, options: ["One", " "] },
    { ...choice, options: ["One", "x".repeat(241)] },
    { ...choice, options: [{ label: "Yes", value: "execute" }, "No"] },
    { ...choice, workflowId: "audit" },
  ]) {
    assert.equal(assistantChoiceSchema.safeParse(invalid).success, false);
  }

  assert.equal(assistantStreamEventSchema.safeParse({ type: "choice", choice }).success, true);
  for (const key of ["interactionReply", "interactionContext"]) {
    assert.equal(assistantRequestSchema.safeParse({ message: "Yes", [key]: {} }).success, false);
  }
});

test("assistant request accepts the public payload and normalizes whitespace", () => {
  const result = assistantRequestSchema.parse({
    message: "  What has Freeman built?  ",
    previousResponseId: null,
    workflowInstanceId: "11111111-1111-4111-8111-111111111111",
  });

  assert.ok("message" in result);
  assert.equal(result.message, "What has Freeman built?");
  assert.equal(result.previousResponseId, null);
  assert.equal(result.workflowInstanceId, "11111111-1111-4111-8111-111111111111");
});

test("assistant request recovers from malformed previous response IDs", () => {
  for (const previousResponseId of ["", "  ", "response_1", "resp_" + "x".repeat(201)]) {
    const result = assistantRequestSchema.parse({ message: "Question", previousResponseId });

    assert.ok("message" in result);
    assert.equal(result.previousResponseId, null);
  }

  const result = assistantRequestSchema.parse({
    message: "Question",
    previousResponseId: " resp_123 ",
  });

  assert.ok("message" in result);
  assert.equal(result.previousResponseId, "resp_123");
});

test("assistant starter workflow starts accept only approved workflow and origin pairs", () => {
  assert.equal(
    assistantRequestSchema.safeParse({
      message: "Start",
      workflowStart: {
        workflowId: "meeting-booking",
        originPage: "/",
        originEntry: "assistant-starter-meeting",
      },
    }).success,
    true,
  );

  for (const workflowStart of [
    {
      workflowId: "contact",
      originPage: "/",
      originEntry: "assistant-starter-contact",
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
    { type: "workflow_instance", instance: null },
    {
      type: "workflow_instance",
      instance: {
        id: "11111111-1111-4111-8111-111111111111",
        workflowId: "meeting-booking",
        workflowVersion: 1,
        revision: 0,
        status: "active",
        progress: {
          phase: "collecting",
          fields: [{ key: "email", required: true, value: "visitor@example.com" }],
          missingRequiredFields: ["name", "reason", "selectedSlot"],
        },
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
        revision: 0,
        status: "active",
        progress: { phase: "collecting", fields: [], missingRequiredFields: [] },
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
        revision: 0,
        status: "active",
        progress: { phase: "collecting", fields: [], missingRequiredFields: [] },
      },
      state: { email: "private@example.com" },
    }).success,
    false,
  );
});

test("retired audit starts and actions are rejected", () => {
  assert.equal(
    assistantRequestSchema.safeParse({
      message: "Start",
      workflowStart: {
        workflowId: "audit",
        originPage: "/",
        originEntry: "home-audit-cta",
      },
    }).success,
    false,
  );
  assert.equal(
    assistantRequestSchema.safeParse({
      action: "confirm_audit",
      workflowInstanceId: "11111111-1111-4111-8111-111111111111",
      expectedRevision: 0,
    }).success,
    false,
  );
});
