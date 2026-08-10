import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

test("proxy allows the Audit page route", () => {
  const response = proxy(new NextRequest("https://freeman.dev/audit"));

  assert.equal(response.headers.get("x-middleware-next"), "1");
});

test("proxy allows the archived Work page route", () => {
  const response = proxy(new NextRequest("https://freeman.dev/work-old"));

  assert.equal(response.headers.get("x-middleware-next"), "1");
});
