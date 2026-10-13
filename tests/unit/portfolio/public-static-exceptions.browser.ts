import assert from "node:assert/strict";
import test from "node:test";
import { createElement, isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PortfolioAction } from "@/app/_portfolio/components/PortfolioAction";
import { PortfolioStoryHero } from "@/app/_portfolio/components/PortfolioStoryHero/PortfolioStoryHero";
import { PortfolioWorkScene } from "@/app/_portfolio/components/PortfolioWorkScene/PortfolioWorkScene";
import { PortfolioSystemsScene } from "@/app/_portfolio/components/PortfolioSystemsScene/PortfolioSystemsScene";
import { PortfolioMoreWork } from "@/app/_portfolio/components/PortfolioMoreWork/PortfolioMoreWork";
import { PortfolioFreemanScene } from "@/app/_portfolio/components/PortfolioFreemanScene/PortfolioFreemanScene";
import { PortfolioAuditScene } from "@/app/_portfolio/components/PortfolioAuditScene/PortfolioAuditScene";
import { PortfolioTestimonials } from "@/app/_portfolio/components/PortfolioTestimonials/PortfolioTestimonials";
import { StoryProjectDetail } from "@/app/_portfolio/components/StoryProjectDetail/StoryProjectDetail";
import {
  portfolioIconRegistry,
  resolvePortfolioIcon,
} from "@/app/_portfolio/components/PortfolioIcon";
import type {
  AboutPresentationData,
  AuditPresentationData,
  HomePresentationData,
  WorkPresentationData,
  PortfolioAction as Action,
  PortfolioProject,
  PortfolioSection,
} from "@/app/_portfolio/data/types";

const section = (title: string): PortfolioSection => ({
  eyebrow: "",
  title,
  copy: `${title} managed copy`,
  icons: [],
  media: [],
  actions: [],
});

const project = (title: string): PortfolioProject => ({
  slug: title.toLowerCase().replaceAll(" ", "-"),
  title,
  category: "Managed category",
  problem: `${title} problem`,
  solution: `${title} contribution`,
  outcome: null,
  externalLinks: [],
  visualBlock: null,
  visualText: null,
  cover: null,
});

const projects = {
  jpscents: project("JPScents"),
  debbyArts: project("Debby Arts"),
  pay4Me: project("Pay4Me"),
  portfolioAssistant: project("Portfolio Assistant"),
  emailPa: project("Email PA"),
  acrossTheHorizon: project("AcrossTheHorizon"),
  shifty: project("Shifty"),
  selfHealing: project("Research"),
};

const home: HomePresentationData = {
  profile: { name: "Managed Name", title: "Managed role", coverImage: null, audience: [] },
  hero: section("Managed positioning"),
  improve: {
    ...section("Managed focus"),
    customerJourney: section("Journey"),
    operationalWorkflow: section("Operations"),
  },
  relevantWork: section("Work"),
  projects,
  testimonials: [],
  audit: {
    ...section("Audit"),
    problem: section("Managed friction"),
    improvement: section("Managed improvement"),
  },
  closing: section("Close"),
};

const work: WorkPresentationData = {
  hero: { ...section("Work"), focus: section("Focus"), approach: section("Approach") },
  relevantWork: section("Relevant"),
  additionalWork: section("More"),
  projects,
  connects: {
    ...section("Connects"),
    products: section("Products"),
    experiences: section("Experiences"),
    workflows: section("Workflows"),
    outcomes: [],
  },
  closing: section("Close"),
};

const about: AboutPresentationData = {
  profile: {
    name: "Managed Name",
    title: "Managed role",
    positioning: "Managed positioning",
    coverImage: null,
    principles: [],
    processPrinciples: [],
    controlPrinciples: [],
  },
  hero: section("About"),
  journey: section("Career"),
  experiences: [
    { title: "Managed employer", tag: null, copy: "Managed experience", insight: null, icons: [] },
  ],
  process: section("Process"),
  exploration: section("Research"),
  outsideEngineering: section("Outside"),
  closing: { ...section("Close"), work: section("Work") },
};

const audit: AuditPresentationData = {
  hero: {
    ...section("Audit"),
    actions: [
      {
        label: "Managed audit action",
        iconName: null,
        copy: null,
        variant: "PRIMARY",
        url: null,
        assistantMessage: "Managed audit intent",
      },
    ],
  },
  process: {
    ...section("Process"),
    stages: [section("Provide context"), section("Review findings")],
  },
  symptoms: section("Symptoms"),
  proof: section("Proof"),
  projects: [],
  closing: section("Close"),
};

function renderedAction(action: Action) {
  const rendered = PortfolioAction({ action });

  assert.ok(isValidElement(rendered));

  return rendered as ReactElement<Record<string, unknown>>;
}

test("managed icons resolve safely", () => {
  assert.equal(resolvePortfolioIcon("Search"), portfolioIconRegistry.Search);
  assert.equal(resolvePortfolioIcon("UnknownIcon"), null);
  assert.equal(resolvePortfolioIcon(null), null);
});

test("managed actions retain link variants and assistant precedence", () => {
  for (const [variant, expectedClass] of Object.entries({
    GHOST: "border-line",
    LINK: "border-none",
    PRIMARY: "bg-accent",
    SECONDARY: "bg-white",
  })) {
    const action: Action = {
      variant: variant as Action["variant"],
      iconName: null,
      label: "Managed action",
      copy: null,
      url: "https://example.com/project",
      assistantMessage: null,
    };

    const markup = renderToStaticMarkup(renderedAction(action));

    assert.match(markup, /href="https:\/\/example.com\/project"/);
    assert.ok(markup.includes(expectedClass));
    assert.equal(
      renderedAction({ ...action, assistantMessage: "Managed question" }).props.detail &&
        (
          renderedAction({ ...action, assistantMessage: "Managed question" }).props.detail as {
            message: string;
          }
        ).message,
      "Managed question",
    );
  }

  assert.equal(
    PortfolioAction({
      action: {
        iconName: null,
        label: "Unavailable",
        copy: null,
        variant: "LINK",
        url: null,
        assistantMessage: null,
      },
    }),
    null,
  );
});

test("opening reads managed identity and positioning, and only renders supplied project media", () => {
  const markup = renderToStaticMarkup(createElement(PortfolioStoryHero, { home }));

  assert.match(markup, /Managed positioning/);
  assert.match(markup, /Managed Name/);
  assert.match(markup, /Managed role/);
  assert.match(markup, /href="#work"/);
  assert.doesNotMatch(markup, /<img/);
  const withMedia = renderToStaticMarkup(
    createElement(PortfolioStoryHero, {
      home: {
        ...home,
        projects: {
          ...projects,
          jpscents: {
            ...projects.jpscents,
            cover: { source: "/managed-scent.png", altText: "Managed scent interface" },
          },
        },
      },
    }),
  );

  assert.match(withMedia, /Managed scent interface/);
  assert.match(withMedia, /managed-scent/);
  assert.match(withMedia, /href="#jpscents"/);
  assert.doesNotMatch(withMedia, /Explore Pay4Me/);
});

test("featured project preserves contribution, outcome, media, and expanded evidence", () => {
  const featured = {
    ...projects.pay4Me,
    outcome: "Verified managed outcome",
    cover: { source: "/managed.png", altText: "Managed project media" },
    externalLinks: ["https://example.com/payments"],
  };

  const markup = renderToStaticMarkup(
    createElement(PortfolioWorkScene, {
      work: { ...work, projects: { ...projects, pay4Me: featured } },
    }),
  );

  for (const evidence of [
    featured.problem,
    featured.solution,
    featured.outcome,
    featured.cover.altText,
  ]) {
    assert.ok(markup.includes(evidence));
  }

  assert.match(markup, /<details/);
  assert.match(markup, /href="https:\/\/example.com\/payments"/);
  assert.doesNotMatch(markup, /href="#"/);
});

test("systems scene renders managed project explanations and working entry buttons", () => {
  const markup = renderToStaticMarkup(createElement(PortfolioSystemsScene, { home, work }));

  assert.ok(markup.includes(projects.portfolioAssistant.solution));
  assert.ok(markup.includes(projects.emailPa.solution));
  assert.match(markup, /Ask your own question/);
  assert.match(markup, /Let’s book a conversation/);
  assert.match(markup, /id="portfolio-assistant"/);
  assert.match(markup, /What did you build for JPScents/);
});

test("all featured projects remain readable in server HTML with stable destinations", () => {
  const markup = renderToStaticMarkup(createElement(PortfolioWorkScene, { work }));

  for (const item of [projects.jpscents, projects.debbyArts, projects.pay4Me]) {
    assert.ok(markup.includes(`id="${item.slug}"`));
    assert.ok(markup.includes(`href="#${item.slug}"`));
    assert.ok(markup.includes(item.solution));
    assert.ok(markup.includes(item.problem));
  }

  assert.ok(markup.indexOf('id="jpscents"') < markup.indexOf('id="debby-arts"'));
  assert.ok(markup.indexOf('id="debby-arts"') < markup.indexOf('id="pay4me"'));
  assert.doesNotMatch(markup, /hidden=""/);
});

test("testimonials render only supplied attributed feedback, with no empty public section", () => {
  assert.equal(
    renderToStaticMarkup(createElement(PortfolioTestimonials, { testimonials: [] })),
    "",
  );
  const markup = renderToStaticMarkup(
    createElement(PortfolioTestimonials, {
      testimonials: [
        {
          quote: "Real feedback from a client.",
          author: "Named Client",
          relationship: "JPScents client",
        },
      ],
    }),
  );

  assert.match(markup, /id="in-their-words"/);
  assert.match(markup, /<blockquote>/);
  assert.match(markup, /Real feedback from a client\./);
  assert.match(markup, /Named Client/);
  assert.match(markup, /JPScents client/);
});

test("additional work remains discoverable, with complete managed detail", () => {
  const markup = renderToStaticMarkup(createElement(PortfolioMoreWork, { work }));

  for (const item of [projects.acrossTheHorizon, projects.shifty, projects.selfHealing]) {
    assert.ok(markup.includes(item.title));
    assert.ok(markup.includes(item.problem));
    assert.ok(markup.includes(item.solution));
  }
});

test("personal scene retains managed experience and portrait without a static identity image", () => {
  const markup = renderToStaticMarkup(createElement(PortfolioFreemanScene, { about, home }));

  assert.match(markup, /Managed employer/);
  assert.match(markup, /Managed experience/);
  assert.doesNotMatch(markup, /About managed copy/);
  assert.doesNotMatch(markup, /<img/);
  const withPortrait = renderToStaticMarkup(
    createElement(PortfolioFreemanScene, {
      about: { ...about, profile: { ...about.profile, coverImage: "/managed-portrait.png" } },
      home,
    }),
  );

  assert.match(withPortrait, /managed-portrait/);
  assert.match(withPortrait, /alt="Managed Name"/);
});

test("experience uses the managed short summary without repeating the full career narrative", () => {
  const markup = renderToStaticMarkup(
    createElement(PortfolioFreemanScene, {
      about: {
        ...about,
        experiences: [{ ...about.experiences[0]!, insight: "A concise managed role summary." }],
      },
      home,
    }),
  );

  assert.match(markup, /Experience/);
  assert.match(markup, /A concise managed role summary/);
  assert.doesNotMatch(markup, /Managed experience/);
});

test("audit retains managed actions, process and example rather than fixed copies", () => {
  const markup = renderToStaticMarkup(createElement(PortfolioAuditScene, { audit, home }));

  for (const evidence of [
    "Managed audit action",
    audit.hero.copy,
    home.audit.problem.copy,
    home.audit.improvement.copy,
    ...audit.process.stages.map((stage) => stage.title),
  ]) {
    assert.ok(markup.includes(evidence));
  }

  assert.match(markup, /Illustrative example/);
});

test("missing project links never create fake destinations", () => {
  assert.doesNotMatch(
    renderToStaticMarkup(createElement(StoryProjectDetail, { project: projects.emailPa })),
    /<a/,
  );
});

test("homepage retains section anchors used by existing assistant citations", () => {
  const markup = renderToStaticMarkup(
    createElement(
      "div",
      null,
      createElement(PortfolioWorkScene, { work }),
      createElement(PortfolioSystemsScene, { home, work }),
      createElement(PortfolioFreemanScene, { about, home }),
      createElement(PortfolioAuditScene, { audit, home }),
    ),
  );

  for (const anchor of [
    "work-relevant",
    "work-connects",
    "about-thinking",
    "about-journey",
    "about-outside",
    "audit-proof",
    "audit-process",
  ]) {
    assert.ok(markup.includes(`id="${anchor}"`), anchor);
  }
});
