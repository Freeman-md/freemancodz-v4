import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

test("proxy allows the homepage and working system routes", async () => {
  for (const path of [
    "/",
    "/work",
    "/work/jpscents",
    "/work/missing-project",
    "/api/chat",
    "/api/admin/media",
    "/api/internal/search-index-worker",
    "/images/logo.svg",
    "/videos/portfolio-clip.webm",
    "/icon.svg",
    "/opengraph-image",
    "/robots.txt",
    "/sitemap.xml",
  ]) {
    const response = await proxy(new NextRequest(`https://freeman.dev${path}`));

    assert.equal(response.headers.get("x-middleware-next"), "1", path);
  }
});

test("proxy redirects every other public page to the homepage", async () => {
  for (const path of [
    "/about",
    "/audit",
    "/home-old",
    "/work-old",
    "/about-old",
    "/unknown/nested-page",
    "/old-page.html",
    "/images-old",
    "/api-old",
  ]) {
    const response = await proxy(new NextRequest(`https://freeman.dev${path}`));

    assert.equal(response.status, 307, path);
    assert.equal(response.headers.get("location"), "https://freeman.dev/", path);
  }
});

test("public redirects retain query parameters and citation fragments", async () => {
  const response = await proxy(
    new NextRequest("https://freeman.dev/about?ref=portfolio#about-journey"),
  );

  assert.equal(
    response.headers.get("location"),
    "https://freeman.dev/?ref=portfolio#about-journey",
  );
});
