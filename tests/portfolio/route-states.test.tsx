import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import AboutLoading from "@/app/about/loading";
import GlobalError from "@/app/error";
import Loading from "@/app/loading";
import WorkLoading from "@/app/work/loading";

test("loading states provide meaningful route-specific placeholders", () => {
  assert.match(renderToStaticMarkup(<Loading />), /Loading portfolio content/);
  assert.match(renderToStaticMarkup(<WorkLoading />), /Loading work/);
  assert.match(renderToStaticMarkup(<AboutLoading />), /Loading about content/);
});

test("error boundary provides a safe recovery interface", () => {
  const markup = renderToStaticMarkup(<GlobalError reset={() => undefined} />);

  assert.match(markup, /Something went wrong/);
  assert.match(markup, /Try again/);
  assert.doesNotMatch(markup, /DATABASE_URL|stack trace|secret/i);
});
