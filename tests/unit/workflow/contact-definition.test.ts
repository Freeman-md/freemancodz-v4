import assert from "node:assert/strict";
import test from "node:test";

import type { ContactRequest } from "@/generated/prisma/client";
import type { ContactService } from "@/modules/contact/service";
import { ContactWorkflowDefinition } from "@/modules/workflow/definitions/contact/contact.definition";

const PREPARATION = {
  workflowInstanceId: "11111111-1111-4111-8111-111111111111",
  interactionId: "22222222-2222-4222-8222-222222222222",
};

const CONFIRMATION = {
  workflowInstanceId: PREPARATION.workflowInstanceId,
  interactionId: "33333333-3333-4333-8333-333333333333",
};

function createContactService() {
  const requests = new Map<string, ContactRequest>();

  let submitCalls = 0;

  const service: Pick<ContactService, "submit"> = {
    submit: async (input) => {
      submitCalls += 1;
      const existing = requests.get(input.workflowInstanceId);

      if (existing) {
        return existing;
      }

      const request: ContactRequest = {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        createdAt: new Date("2026-09-23T12:00:00.000Z"),
        ...input,
      };

      requests.set(input.workflowInstanceId, request);

      return request;
    },
  };

  return {
    service,
    get createdCount() {
      return requests.size;
    },
    get submitCalls() {
      return submitCalls;
    },
  };
}

test("Contact collects all supplied details and asks only for missing required fields", async () => {
  const contact = createContactService();

  const definition = new ContactWorkflowDefinition(contact.service);

  const initial = definition.createInitialState({
    originChannel: "web",
    originPage: "/",
    originEntry: "assistant-starter-contact",
  });

  const updated = await definition.executeTool(
    "update_contact_context",
    JSON.stringify({
      updates: [
        { field: "name", value: "Visitor" },
        { field: "businessName", value: "Example Ltd" },
        { field: "message", value: "I would like help with a project." },
      ],
    }),
    initial,
    PREPARATION,
  );

  assert.deepEqual(updated.output.missingRequiredFields, ["email"]);
  assert.equal(updated.state.businessName, "Example Ltd");
  assert.match(definition.getInstructions(updated.state), /email/);
  assert.equal(contact.createdCount, 0);
});

test("Contact requires preparation and later confirmation, invalidates corrections, and stays idempotent", async () => {
  const contact = createContactService();

  const definition = new ContactWorkflowDefinition(contact.service);

  const initial = definition.createInitialState({
    originChannel: "web",
    originPage: "/",
    originEntry: "assistant-starter-contact",
  });

  const updated = await definition.executeTool(
    "update_contact_context",
    JSON.stringify({
      updates: [
        { field: "name", value: "Visitor" },
        { field: "email", value: "visitor@example.com" },
        { field: "message", value: "I would like help with a project." },
      ],
    }),
    initial,
    PREPARATION,
  );

  const prepared = await definition.executeTool(
    "prepare_contact_submission",
    "{}",
    updated.state,
    PREPARATION,
  );

  assert.equal(prepared.output.kind, "contact_preparation");
  assert.equal(contact.createdCount, 0);

  const sameInteraction = await definition.executeTool(
    "submit_contact",
    "{}",
    prepared.state,
    PREPARATION,
  );

  assert.equal(sameInteraction.output.error, "confirmation_requires_new_input");

  const corrected = await definition.executeTool(
    "update_contact_context",
    JSON.stringify({ updates: [{ field: "message", value: "Corrected project enquiry." }] }),
    prepared.state,
    CONFIRMATION,
  );

  assert.equal(corrected.state.preparedInteractionId, null);
  assert.equal(
    (await definition.executeTool("submit_contact", "{}", corrected.state, CONFIRMATION)).output
      .error,
    "preparation_required",
  );

  const rePrepared = await definition.executeTool(
    "prepare_contact_submission",
    "{}",
    corrected.state,
    PREPARATION,
  );

  const submitted = await definition.executeTool(
    "submit_contact",
    "{}",
    rePrepared.state,
    CONFIRMATION,
  );

  const retried = await definition.executeTool(
    "submit_contact",
    "{}",
    rePrepared.state,
    CONFIRMATION,
  );

  assert.equal(submitted.status, "completed");
  assert.equal(submitted.output.message, "Your message was sent to Freeman.");
  assert.equal(retried.status, "completed");
  assert.equal(contact.submitCalls, 2);
  assert.equal(contact.createdCount, 1);
});
