import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { MAX_CHAT_BODY_BYTES } from "@/app/api/chat/constants";
import type { RateLimitResult } from "@/modules/rate-limit/rate-limit.types";
import {
  chatRequest,
  chatRequestOptions,
  complete,
  createChatFixture,
  delta,
  parseEvents,
  providerEvents,
  readEvents,
  startChatServer,
  toolCall,
} from "./chat.fixture";

const requestBody = JSON.stringify({
  message: "What did Freeman build for JPScents?",
  previousResponseId: "resp_previous",
});

test("streams a plain reply before completion", { timeout: 5000 }, async () => {
  const finish = Promise.withResolvers<void>();

  const { post, requests } = createChatFixture(async () =>
    (async function* () {
      yield* providerEvents(delta("Hello."));
      await finish.promise;
      yield* providerEvents(complete("resp_reply"));
    })(),
  );

  const response = await post(chatRequest(requestBody));

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/x-ndjson/);
  assert.ok(response.body);

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

  try {
    const first = await reader.read();

    assert.ok(!first.done);
    assert.deepEqual(parseEvents(first.value), [{ type: "delta", delta: "Hello." }]);
    assert.equal(requests[0].previousResponseId, "resp_previous");
  } finally {
    finish.resolve();
  }

  assert.deepEqual(await readEvents(reader), [
    { type: "response_id", responseId: "resp_reply" },
    { type: "done" },
  ]);
  assert.equal(requests.length, 1);
});

test("offers choices after the completed question", async () => {
  const options = ["A web app", "A mobile app"];

  const call = toolCall("ask_user_choice", { options });

  const { post, requests } = createChatFixture(async ({ previousResponseId }) =>
    previousResponseId === "resp_tool"
      ? providerEvents(delta("What are you looking to build?"), complete("resp_question"))
      : providerEvents(
          { type: "response.output_item.done", item: call },
          complete("resp_tool", [call]),
        ),
  );

  assert.deepEqual(parseEvents(await (await post(chatRequest(requestBody))).text()), [
    { type: "delta", delta: "What are you looking to build?" },
    { type: "options", options },
    { type: "response_id", responseId: "resp_question" },
    { type: "done" },
  ]);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[1].tools, []);
  assert.deepEqual(requests[1].input, [
    { type: "function_call_output", callId: "call_1", output: JSON.stringify({ options }) },
  ]);
});

test("uses search excerpts and returns related sources after completion", async (t) => {
  const source = { id: "project:jpscents", title: "JPScents", url: "/work/jpscents" };

  const excerpts = [
    "Freeman built a fragrance storefront.",
    "Stock availability is shown by size.",
  ];

  const query = "JPScents contribution";

  for (const matches of [excerpts, []]) {
    await t.test(
      matches.length ? "deduplicates matching sources" : "omits sources for an empty search",
      async () => {
        const answer = matches.length
          ? "Freeman built the storefront."
          : "I couldn’t find enough information.";

        const queries: string[] = [];

        const { post, requests } = createChatFixture(
          async ({ previousResponseId }) =>
            previousResponseId === "resp_search"
              ? providerEvents(delta(answer), complete("resp_answer"))
              : providerEvents(complete("resp_search", [toolCall("search_portfolio", { query })])),
          {
            search: async (query) => {
              queries.push(query);

              return matches.map((excerpt) => ({ excerpt, source }));
            },
          },
        );

        assert.deepEqual(parseEvents(await (await post(chatRequest(requestBody))).text()), [
          { type: "delta", delta: answer },
          ...(matches.length ? [{ type: "sources", sources: [source] }] : []),
          { type: "response_id", responseId: "resp_answer" },
          { type: "done" },
        ]);
        assert.deepEqual(queries, [query]);
        assert.deepEqual(requests[1].input, [
          {
            type: "function_call_output",
            callId: "call_1",
            output: JSON.stringify({ excerpts: matches }),
          },
        ]);
      },
    );
  }
});

test("reports search outages and unfinished provider turns safely", async (t) => {
  await t.test("search outage gets a specific public error", async () => {
    const { post, requests, errors } = createChatFixture(
      async () =>
        providerEvents(
          complete("resp_search", [toolCall("search_portfolio", { query: "JPScents" })]),
        ),
      {
        search: async () => {
          throw new Error("internal database diagnostic");
        },
      },
    );

    assert.deepEqual(parseEvents(await (await post(chatRequest(requestBody))).text()), [
      {
        type: "error",
        error: "I couldn’t search the portfolio just now. Please try again shortly.",
      },
    ]);
    assert.deepEqual(errors, ["assistant.portfolio_search_failed"]);
    assert.equal(requests.length, 1);
  });

  await t.test("incomplete turn never executes a tool or publishes completion", async () => {
    const call = toolCall("search_portfolio", { query: "JPScents" });

    let searches = 0;

    const { post, requests, errors } = createChatFixture(
      async () =>
        providerEvents(delta("Checking the portfolio…"), {
          type: "response.output_item.done",
          item: call,
        }),
      {
        search: async () => {
          searches++;

          return [];
        },
      },
    );

    assert.deepEqual(parseEvents(await (await post(chatRequest(requestBody))).text()), [
      { type: "delta", delta: "Checking the portfolio…" },
      { type: "error", error: "The assistant could not respond. Please try again." },
    ]);
    assert.deepEqual(errors, ["assistant.response_failed"]);
    assert.equal(searches, 0);
    assert.equal(requests.length, 1);
  });
});

test("cancels the provider on HTTP disconnect", { timeout: 5000 }, async (t) => {
  const providerStopped = Promise.withResolvers<void>();

  const { post, errors } = createChatFixture(async ({ signal }) =>
    (async function* () {
      const abort = once(signal, "abort", { signal: t.signal });

      yield* providerEvents(delta("Started."));
      await abort;
      providerStopped.resolve();
      signal.throwIfAborted();
    })(),
  );

  const url = await startChatServer(t, post);

  const controller = new AbortController();

  const response = await fetch(url, {
    ...chatRequestOptions,
    body: requestBody,
    signal: controller.signal,
  });

  assert.equal(response.status, 200);
  assert.ok(response.body);

  const reader = response.body.getReader();

  const first = await reader.read();

  assert.ok(!first.done);
  assert.deepEqual(parseEvents(new TextDecoder().decode(first.value)), [
    { type: "delta", delta: "Started." },
  ]);
  controller.abort();
  await assert.rejects(reader.read(), { name: "AbortError" });
  await providerStopped.promise;
  assert.deepEqual(errors, []);
});

test("rejects invalid, oversized, and rate-limited requests before generation", async (t) => {
  const denied: RateLimitResult = {
    allowed: false,
    limit: 40,
    remaining: 0,
    resetAt: Date.now() + 60_000,
  };

  const cases: { name: string; body: string; status: number; limit?: RateLimitResult }[] = [
    { name: "invalid message", body: '{"message":""}', status: 400 },
    {
      name: "retired workflow reference",
      body: JSON.stringify({ message: "Hello", workflowInstanceId: null }),
      status: 400,
    },
    {
      name: "retired booking action",
      body: JSON.stringify({
        action: "confirm_booking",
        workflowInstanceId: `11111111-1111-4111-8111-111111111111.${"a".repeat(43)}`,
        expectedRevision: 0,
      }),
      status: 400,
      limit: denied,
    },
    { name: "oversized body", body: "x".repeat(MAX_CHAT_BODY_BYTES + 1), status: 413 },
    {
      name: "rate-limited request",
      body: requestBody,
      status: 429,
      limit: denied,
    },
  ];

  for (const { name, body, status, limit } of cases) {
    await t.test(name, async () => {
      const { post, requests } = createChatFixture(
        async () => providerEvents(complete("resp_unexpected")),
        {
          limit,
        },
      );

      assert.equal((await post(chatRequest(body))).status, status);
      assert.deepEqual(requests, []);
    });
  }
});
