import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY } from "@/app/_assistant/constants";
import { useAssistant } from "@/app/_assistant/hooks/useAssistant";

const FIRST_WORKFLOW_ID = "00000000-0000-4000-8000-000000000001";

const SECOND_WORKFLOW_ID = "00000000-0000-4000-8000-000000000002";

function streamResponse(events: unknown[]) {
  return new Response(`${events.map((event) => JSON.stringify(event)).join("\n")}\n`);
}

function workflowEvent(id: string, status: "active" | "completed" | "cancelled") {
  return {
    type: "workflow_instance",
    instance: {
      id,
      workflowId: "meeting-booking",
      workflowVersion: 1,
      revision: 0,
      status,
      progress: {
        phase: status === "active" ? "collecting" : status,
        fields: [],
        missingRequiredFields: [],
      },
    },
  };
}

test("active workflow IDs survive remounts and clear when finished or retired", async () => {
  const dom = new JSDOM("<!doctype html><html><body><main></main></body></html>", {
    url: "http://localhost:3000",
  });

  const previous = new Map<string, PropertyDescriptor | undefined>();

  for (const [name, value] of Object.entries({
    window: dom.window,
    self: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }

  const originalFetch = globalThis.fetch;

  const responses: Response[] = [];

  const requests: Array<Record<string, unknown>> = [];

  globalThis.fetch = async (_input, init) => {
    requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);

    const response = responses.shift();

    assert.ok(response, "Missing assistant response fixture");

    return response;
  };

  const { createRoot } = await import("react-dom/client");

  let assistant: ReturnType<typeof useAssistant> | null = null;

  let root = createRoot(dom.window.document.querySelector("main")!);

  function Harness() {
    assistant = useAssistant();

    return null;
  }

  function currentAssistant() {
    assert.ok(assistant, "Assistant hook has not rendered");

    return assistant;
  }

  try {
    dom.window.sessionStorage.setItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY, "not-a-uuid");

    await act(async () => root.render(createElement(Harness)));
    assert.equal(dom.window.sessionStorage.getItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY), null);

    responses.push(
      streamResponse([
        workflowEvent(FIRST_WORKFLOW_ID, "active"),
        { type: "response_id", responseId: "resp_before_refresh" },
        { type: "done" },
      ]),
    );
    await act(async () => currentAssistant().submitMessage("Start a workflow"));
    assert.equal(
      dom.window.sessionStorage.getItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY),
      FIRST_WORKFLOW_ID,
    );
    assert.equal(currentAssistant().workflowInstance?.id, FIRST_WORKFLOW_ID);
    assert.equal(currentAssistant().messages.length, 2);

    await act(async () => root.unmount());
    assistant = null;
    const remountedContainer = dom.window.document.createElement("main");

    dom.window.document.body.append(remountedContainer);
    root = createRoot(remountedContainer);
    await act(async () => root.render(createElement(Harness)));
    assert.deepEqual(currentAssistant().messages, []);
    assert.equal(currentAssistant().workflowInstance, null);

    responses.push(
      streamResponse([workflowEvent(FIRST_WORKFLOW_ID, "completed"), { type: "done" }]),
    );
    await act(async () => currentAssistant().submitMessage("Continue the workflow"));
    assert.equal(requests[1]?.workflowInstanceId, FIRST_WORKFLOW_ID);
    assert.equal(requests[1]?.previousResponseId, null);
    assert.equal(dom.window.sessionStorage.getItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY), null);
    assert.equal(currentAssistant().workflowInstance?.status, "completed");

    responses.push(streamResponse([workflowEvent(SECOND_WORKFLOW_ID, "active"), { type: "done" }]));
    await act(async () => currentAssistant().submitMessage("Start another workflow"));
    assert.equal(
      dom.window.sessionStorage.getItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY),
      SECOND_WORKFLOW_ID,
    );

    let releaseAction!: (response: Response) => void;

    const actionResponse = new Promise<Response>((resolve) => {
      releaseAction = resolve;
    });

    const responseFetch = globalThis.fetch;

    globalThis.fetch = async (_input, init) => {
      requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);

      return actionResponse;
    };

    const action = {
      action: "confirm_booking" as const,
      workflowInstanceId: SECOND_WORKFLOW_ID,
      expectedRevision: 4,
    };

    let pendingAction!: Promise<void>;

    const draft = "Cancel the workflow";

    await act(async () => currentAssistant().setInput(draft));
    await act(async () => {
      pendingAction = currentAssistant().submitWorkflowAction(action);
      await currentAssistant().submitWorkflowAction(action);
    });
    assert.deepEqual(requests.at(-1), action);
    assert.equal(requests.filter((request) => request.action === "confirm_booking").length, 1);
    assert.equal(currentAssistant().isLoading, true);
    assert.equal(currentAssistant().input, draft);
    await act(async () => {
      releaseAction(
        streamResponse([workflowEvent(SECOND_WORKFLOW_ID, "active"), { type: "done" }]),
      );
      await pendingAction;
    });
    globalThis.fetch = responseFetch;
    assert.equal(currentAssistant().input, draft);

    const retry = { action: "retry_booking" as const, workflowInstanceId: SECOND_WORKFLOW_ID };

    responses.push(streamResponse([workflowEvent(SECOND_WORKFLOW_ID, "active"), { type: "done" }]));
    await act(async () => currentAssistant().submitWorkflowAction(retry));
    assert.deepEqual(requests.at(-1), retry);
    assert.equal(currentAssistant().input, draft);

    responses.push(
      streamResponse([workflowEvent(SECOND_WORKFLOW_ID, "cancelled"), { type: "done" }]),
    );
    await act(async () => currentAssistant().submitMessage(currentAssistant().input));
    assert.equal(requests.at(-1)?.message, draft);
    assert.equal(requests.at(-1)?.previousResponseId, null);
    assert.equal(currentAssistant().input, "");
    assert.equal(dom.window.sessionStorage.getItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY), null);
    assert.equal(currentAssistant().workflowInstance?.status, "cancelled");

    responses.push(
      streamResponse([
        workflowEvent(FIRST_WORKFLOW_ID, "active"),
        { type: "response_id", responseId: "resp_retired" },
        { type: "done" },
      ]),
    );
    await act(async () => currentAssistant().submitMessage("Load saved workflow"));
    responses.push(streamResponse([{ type: "workflow_instance", instance: null }, { type: "done" }]));
    await act(async () => currentAssistant().submitMessage("Resume saved workflow"));
    assert.equal(requests.at(-1)?.workflowInstanceId, FIRST_WORKFLOW_ID);
    assert.equal(requests.at(-1)?.previousResponseId, "resp_retired");
    assert.equal(currentAssistant().workflowInstance, null);
    assert.equal(dom.window.sessionStorage.getItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY), null);

    responses.push(streamResponse([{ type: "done" }]));
    await act(async () => currentAssistant().submitMessage("Continue chatting"));
    assert.equal(requests.at(-1)?.workflowInstanceId, null);
    assert.equal(requests.at(-1)?.previousResponseId, null);
  } finally {
    await act(async () => root.unmount());
    globalThis.fetch = originalFetch;
    dom.window.close();

    for (const [name, descriptor] of previous) {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, name);
      }
    }
  }
});
