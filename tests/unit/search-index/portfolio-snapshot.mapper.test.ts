import assert from "node:assert/strict";
import test from "node:test";

import {
  mapPortfolioSnapshot,
  stripMarkdownUrlDestinations,
} from "@/server/modules/search-index/mappers/portfolio-snapshot.mapper";
import { createPortfolioSnapshotFixture } from "./search-index.fixture";

function assertAppearsBefore(values: string[], first: string, second: string): void {
  const firstIndex = values.findIndex((value) => value.includes(first));

  const secondIndex = values.findIndex((value) => value.includes(second));

  assert.ok(firstIndex >= 0, `Expected text containing ${first}.`);
  assert.ok(secondIndex >= 0, `Expected text containing ${second}.`);
  assert.ok(firstIndex < secondIndex, `Expected ${first} before ${second}.`);
}

test("maps and deduplicates the complete public portfolio with stable identities", () => {
  const documents = mapPortfolioSnapshot(createPortfolioSnapshotFixture());

  assert.deepEqual(
    documents.map(({ sourceType, sourceId }) => `${sourceType}:${sourceId}`),
    [
      "profile:global",
      "content_block:content-root",
      "project:project-1",
      "project:project-2",
      "experience:experience-1",
    ],
  );

  const content = documents.find(({ sourceType }) => sourceType === "content_block");

  const profile = documents.find(({ sourceType }) => sourceType === "profile");

  const project = documents.find(
    ({ sourceType, sourceId }) => sourceType === "project" && sourceId === "project-1",
  );

  const experience = documents.find(({ sourceType }) => sourceType === "experience");

  assert.ok(content);
  assert.ok(profile);
  assert.ok(project);
  assert.ok(experience);
  assert.equal(content.url, "/#customer-journey");
  assert.equal(project.url, "/work");
  assert.equal(experience.url, "/about#about-journey");
  assert.doesNotMatch(
    profile.paragraphs.join("\n"),
    /freeman@example|linkedin\.example|github\.example|storage\.example/,
  );
  assert.match(content.paragraphs.join("\n"), /Clear next step: Make action obvious/);
  assert.match(content.paragraphs.join("\n"), /Customer action flowing/);
  assert.match(content.paragraphs.join("\n"), /Tell me about the workflow/);
  assert.match(content.paragraphs.join("\n"), /Operational workflow/);
  assert.doesNotMatch(content.paragraphs.join("\n"), /storage\.example|internal-media/);
  assert.match(project.paragraphs.join("\n"), /Read the case study/);
  assert.doesNotMatch(
    project.paragraphs.join("\n"),
    /private\.example|storage\.example|InternalVisualComponent/,
  );
});

test("uses fixed collection ordering and related-id tie-breaks", () => {
  const snapshot = createPortfolioSnapshotFixture();

  const profile = snapshot.home.profile;

  const audience = profile.iconCollections[0]!;

  const principleIcon = {
    ...audience.iconBlock,
    id: "profile-principle",
    label: "Principle detail",
  };

  profile.iconCollections = [
    {
      ...audience,
      iconBlockId: principleIcon.id,
      collection: "PRINCIPLES",
      iconBlock: principleIcon,
    },
    audience,
  ];

  const root = snapshot.home.contentBlocks[0]!;

  const current = root.iconBlocks[0]!;

  const tiedIcon = { ...current.iconBlock, id: "a-content-icon", label: "First tied item" };

  root.iconBlocks.push({
    ...current,
    iconBlockId: tiedIcon.id,
    iconBlock: tiedIcon,
  });

  const currentChild = root.children[0]!;

  currentChild.order = 2;
  root.children.push(
    {
      order: 1,
      child: { ...currentChild.child, id: "b-content-child", title: "Second ordered child" },
    },
    {
      order: 1,
      child: { ...currentChild.child, id: "a-content-child", title: "First ordered child" },
    },
  );

  const currentMedia = root.mediaBlocks[0]!;

  currentMedia.order = 2;
  root.mediaBlocks.push(
    {
      ...currentMedia,
      order: 1,
      mediaBlockId: "b-content-media",
      mediaBlock: {
        ...currentMedia.mediaBlock,
        id: "b-content-media",
        altText: "Second ordered media",
        iconBlock: {
          ...currentMedia.mediaBlock.iconBlock,
          id: "b-content-media",
          label: "Second media label",
        },
      },
    },
    {
      ...currentMedia,
      order: 1,
      mediaBlockId: "a-content-media",
      mediaBlock: {
        ...currentMedia.mediaBlock,
        id: "a-content-media",
        altText: "First ordered media",
        iconBlock: {
          ...currentMedia.mediaBlock.iconBlock,
          id: "a-content-media",
          label: "First media label",
        },
      },
    },
  );

  const currentAction = root.actionBlocks[0]!;

  currentAction.order = 2;
  root.actionBlocks.push(
    {
      ...currentAction,
      order: 1,
      actionBlockId: "b-content-action",
      actionBlock: {
        ...currentAction.actionBlock,
        id: "b-content-action",
        assistantMessage: "Second ordered action",
        iconBlock: {
          ...currentAction.actionBlock.iconBlock,
          id: "b-content-action",
          label: "Second action label",
        },
      },
    },
    {
      ...currentAction,
      order: 1,
      actionBlockId: "a-content-action",
      actionBlock: {
        ...currentAction.actionBlock,
        id: "a-content-action",
        assistantMessage: "First ordered action",
        iconBlock: {
          ...currentAction.actionBlock.iconBlock,
          id: "a-content-action",
          label: "First action label",
        },
      },
    },
  );

  const documents = mapPortfolioSnapshot(snapshot);

  const profileText = documents.find(({ sourceType }) => sourceType === "profile")!.paragraphs;

  const contentText = documents.find(
    ({ sourceType }) => sourceType === "content_block",
  )!.paragraphs;

  assert.ok(profileText.findIndex((value) => value.startsWith("Audience:")) >= 0);
  assert.ok(
    profileText.findIndex((value) => value.startsWith("Audience:")) <
      profileText.findIndex((value) => value.startsWith("Principles:")),
  );
  assertAppearsBefore(contentText, "First tied item", "Clear next step");
  assertAppearsBefore(contentText, "First ordered child", "Second ordered child");
  assertAppearsBefore(contentText, "Second ordered child", "Operational workflow");
  assertAppearsBefore(contentText, "First ordered media", "Second ordered media");
  assertAppearsBefore(contentText, "Second ordered media", "Customer action flowing");
  assertAppearsBefore(contentText, "First ordered action", "Second ordered action");
  assertAppearsBefore(contentText, "Second ordered action", "Tell me about the workflow");
});

test("strips inline, reference, autolink and bare URL destinations from markdown", () => {
  const markdown = [
    "[Case study](https://example.com/private)",
    "![Architecture](https://example.com/image.png)",
    "[Reference][details]",
    "[details]: https://example.com/reference",
    "<https://example.com/autolink>",
    "Bare https://example.com/bare and www.example.com/another",
  ].join("\n");

  const cleaned = stripMarkdownUrlDestinations(markdown);

  assert.match(cleaned, /Case study/);
  assert.match(cleaned, /Architecture/);
  assert.match(cleaned, /Reference/);
  assert.doesNotMatch(cleaned, /https?:\/\/|www\./);
});

test("fails closed on conflicting duplicate identities", () => {
  const snapshot = createPortfolioSnapshotFixture();

  const project = snapshot.work.projects[0];

  assert.ok(project);

  snapshot.home.projects = [{ ...project, title: "Conflicting project title" }];

  assert.throws(() => mapPortfolioSnapshot(snapshot), /conflicting duplicate source identities/);
});

test("fails closed on invalid provenance and cyclic content trees", () => {
  const invalidProvenance = createPortfolioSnapshotFixture();

  invalidProvenance.home.contentBlocks[0]!.url = "https://storage.example/private";

  assert.throws(() => mapPortfolioSnapshot(invalidProvenance), /invalid public provenance/);

  const cyclic = createPortfolioSnapshotFixture();

  const root = cyclic.home.contentBlocks[0]!;

  const child = root.children[0]!.child;

  child.children.push({ order: 1, child: root });

  assert.throws(() => mapPortfolioSnapshot(cyclic), /cyclic content tree/);
});
