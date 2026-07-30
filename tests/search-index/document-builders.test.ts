import assert from "node:assert/strict";
import test from "node:test";
import type {
  ContentBlock,
  Experience,
  Principle,
  Project,
  Service,
} from "@/generated/prisma/client";
import { buildContentBlockDocuments } from "@/server/modules/search-index/mappers/build-content-block-documents";
import { buildExperienceDocuments } from "@/server/modules/search-index/mappers/build-experience-documents";
import { buildPrincipleDocuments } from "@/server/modules/search-index/mappers/build-principle-documents";
import { buildProjectDocuments } from "@/server/modules/search-index/mappers/build-project-documents";
import { buildServiceDocuments } from "@/server/modules/search-index/mappers/build-service-documents";

const timestamp = new Date("2026-07-19T00:00:00.000Z");

test("buildProjectDocuments creates one deliberate search document", () => {
  const project = {
    id: "project-1",
    title: "Grounded Assistant",
    summary: "A customer-facing assistant grounded in trusted sources.",
    category: "AI Engineering",
    role: "Full-stack engineer",
    outcome: "Produced cited answers from portfolio content.",
    detail: "Implemented retrieval, context injection and answer generation.",
    future: null,
    collaboration: null,
    positioning: "A practical customer-facing assistant.",
    featured: true,
    position: 1,
    stacks: ["TypeScript", "Next.js", "Supabase"],
    links: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Project;

  assert.deepEqual(buildProjectDocuments(project), [
    {
      sourceType: "projects",
      sourceId: "project-1",
      documentIndex: 0,
      title: "Grounded Assistant",
      category: "AI Engineering",
      url: "/work",
      content: [
        "Summary: A customer-facing assistant grounded in trusted sources.",
        "Role: Full-stack engineer",
        "Outcome: Produced cited answers from portfolio content.",
        "Details: Implemented retrieval, context injection and answer generation.",
        "Positioning: A practical customer-facing assistant.",
        "Technologies: Next.js, Supabase, TypeScript",
      ].join("\n\n"),
      keywords: [
        "AI Engineering",
        "Full-stack engineer",
        "Next.js",
        "Supabase",
        "TypeScript",
      ],
    },
  ]);
});

test("project UI-only fields do not change search output", () => {
  const base = {
    id: "project-1",
    title: "Grounded Assistant",
    summary: "Summary",
    category: "AI Engineering",
    role: "Engineer",
    outcome: "Outcome",
    detail: "Detail",
    future: null,
    collaboration: null,
    positioning: null,
    featured: false,
    position: 0,
    stacks: ["TypeScript"],
    links: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Project;

  const changedUiFields = {
    ...base,
    featured: true,
    position: 99,
    links: [{ label: "Live", href: "https://example.com" }],
    updatedAt: new Date("2026-07-20T00:00:00.000Z"),
  } satisfies Project;

  assert.deepEqual(
    buildProjectDocuments(base),
    buildProjectDocuments(changedUiFields),
  );
});

test("buildExperienceDocuments includes a non-null location", () => {
  const experience = {
    id: "experience-1",
    title: "Staff Engineer",
    company: "Northstar Labs",
    dates: "2024–2026",
    location: "London, UK",
    category: "Product Engineering",
    focus: "Reliable product systems",
    position: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Experience;

  assert.deepEqual(buildExperienceDocuments(experience), [
    {
      sourceType: "experiences",
      sourceId: "experience-1",
      documentIndex: 0,
      title: "Staff Engineer at Northstar Labs",
      category: "Product Engineering",
      url: "/about",
      content: [
        "Role: Staff Engineer",
        "Company: Northstar Labs",
        "Dates: 2024–2026",
        "Location: London, UK",
        "Focus: Reliable product systems",
      ].join("\n\n"),
      keywords: ["Northstar Labs", "Product Engineering", "Staff Engineer"],
    },
  ]);
});

test("buildExperienceDocuments omits a null location", () => {
  const experience = {
    id: "experience-2",
    title: "Platform Engineer",
    company: "Signal Works",
    dates: "2022–2024",
    location: null,
    category: "Platform",
    focus: "Developer tooling",
    position: 2,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Experience;

  assert.deepEqual(buildExperienceDocuments(experience), [
    {
      sourceType: "experiences",
      sourceId: "experience-2",
      documentIndex: 0,
      title: "Platform Engineer at Signal Works",
      category: "Platform",
      url: "/about",
      content: [
        "Role: Platform Engineer",
        "Company: Signal Works",
        "Dates: 2022–2024",
        "Focus: Developer tooling",
      ].join("\n\n"),
      keywords: ["Platform", "Platform Engineer", "Signal Works"],
    },
  ]);
});

test("buildServiceDocuments includes a non-null assistant prompt", () => {
  const service = {
    id: "service-1",
    title: "AI Strategy",
    lead: "Turn an unclear idea into a useful direction.",
    description: "Shape the problem, system and next practical step.",
    cta: "Start a conversation",
    assistantPrompt: "Help me choose an AI project.",
    position: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Service;

  assert.deepEqual(buildServiceDocuments(service), [
    {
      sourceType: "services",
      sourceId: "service-1",
      documentIndex: 0,
      title: "AI Strategy",
      category: "Service",
      url: "/",
      content: [
        "Overview: Turn an unclear idea into a useful direction.",
        "Description: Shape the problem, system and next practical step.",
        "Example request: Help me choose an AI project.",
      ].join("\n\n"),
      keywords: ["AI Strategy", "Service"],
    },
  ]);
});

test("buildServiceDocuments omits a null assistant prompt", () => {
  const service = {
    id: "service-2",
    title: "Technical Review",
    lead: "Make the next technical decision clearer.",
    description: "Review architecture, trade-offs and implementation risk.",
    cta: "Book a review",
    assistantPrompt: null,
    position: 2,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Service;

  assert.deepEqual(buildServiceDocuments(service), [
    {
      sourceType: "services",
      sourceId: "service-2",
      documentIndex: 0,
      title: "Technical Review",
      category: "Service",
      url: "/",
      content: [
        "Overview: Make the next technical decision clearer.",
        "Description: Review architecture, trade-offs and implementation risk.",
      ].join("\n\n"),
      keywords: ["Service", "Technical Review"],
    },
  ]);
});

test("service UI-only fields do not change search output", () => {
  const base = {
    id: "service-3",
    title: "Delivery Partnership",
    lead: "Move from plan to a working slice.",
    description: "Build and validate the smallest useful version.",
    cta: "Work together",
    assistantPrompt: null,
    position: 3,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Service;

  const changedUiFields = {
    ...base,
    cta: "Choose this service",
    position: 99,
    updatedAt: new Date("2026-07-20T00:00:00.000Z"),
  } satisfies Service;

  assert.deepEqual(
    buildServiceDocuments(base),
    buildServiceDocuments(changedUiFields),
  );
});

test("buildPrincipleDocuments maps supported sections to their URLs", () => {
  const home = {
    id: "principle-home",
    section: "home",
    title: "Make it useful",
    body: "Start with the real problem.",
    position: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Principle;
  const about = {
    ...home,
    id: "principle-about",
    section: "about",
    title: "Stay curious",
    body: "Keep learning in public.",
  } satisfies Principle;

  assert.deepEqual(buildPrincipleDocuments(home), [
    {
      sourceType: "principles",
      sourceId: "principle-home",
      documentIndex: 0,
      title: "Make it useful",
      category: "Principle",
      url: "/",
      content: "Start with the real problem.",
      keywords: ["Make it useful", "Principle", "home"],
    },
  ]);
  assert.deepEqual(buildPrincipleDocuments(about), [
    {
      sourceType: "principles",
      sourceId: "principle-about",
      documentIndex: 0,
      title: "Stay curious",
      category: "Principle",
      url: "/about",
      content: "Keep learning in public.",
      keywords: ["Principle", "Stay curious", "about"],
    },
  ]);
});

test("buildPrincipleDocuments returns no document for an unsupported section", () => {
  const principle = {
    id: "principle-unknown",
    section: "contact",
    title: "Unknown placement",
    body: "This should not be indexed.",
    position: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Principle;

  assert.deepEqual(buildPrincipleDocuments(principle), []);
});

test("buildContentBlockDocuments creates exact output for every supported format", () => {
  const blocks = [
    {
      id: "block-hero",
      key: "home.hero",
      page: "HOME",
      section: "HERO",
      position: 0,
      content: {
        name: "Freeman",
        headline: "Engineer for useful systems",
        intro: "I build thoughtful software.",
        heroNote: "Based in London.",
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies ContentBlock,
    {
      id: "block-philosophy",
      key: "home.philosophy",
      page: "HOME",
      section: "PHILOSOPHY",
      position: 0,
      content: { philosophyQuestion: "What makes software worth using?" },
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies ContentBlock,
    {
      id: "block-direction",
      key: "home.current-direction",
      page: "HOME",
      section: "CURRENT_DIRECTION",
      position: 0,
      content: {
        currentDirection: "Building search experiences.",
        currentDirectionSupport: "With careful indexing and retrieval.",
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies ContentBlock,
    {
      id: "block-about-header",
      key: "about.header",
      page: "ABOUT",
      section: "ABOUT_HEADER",
      position: 0,
      content: { aboutHeadline: "A little more about how I work." },
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies ContentBlock,
    {
      id: "block-education",
      key: "about.education",
      page: "ABOUT",
      section: "EDUCATION",
      position: 0,
      content: {
        current: "Software engineering",
        previous: "Computer science",
        research: "Human-centred AI",
        support: "Always learning by building.",
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies ContentBlock,
    {
      id: "block-intro",
      key: "about.intro.0",
      page: "ABOUT",
      section: "ABOUT_INTRO",
      position: 0,
      content: { body: "I care about clarity, craft and momentum." },
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies ContentBlock,
    {
      id: "block-process",
      key: "about.work-process.0",
      page: "ABOUT",
      section: "WORK_PROCESS",
      position: 0,
      content: { body: "Understand, simplify, build, learn." },
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies ContentBlock,
    {
      id: "block-outside",
      key: "about.outside-engineering.0",
      page: "ABOUT",
      section: "OUTSIDE_ENGINEERING",
      position: 0,
      content: {
        title: "Writing",
        description: "I write to make complex ideas easier to share.",
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies ContentBlock,
  ];

  assert.deepEqual(buildContentBlockDocuments(blocks[0]), [
    {
      sourceType: "content_blocks",
      sourceId: "block-hero",
      documentIndex: 0,
      title: "Freeman",
      category: "Profile",
      url: "/",
      content: [
        "Name: Freeman",
        "Headline: Engineer for useful systems",
        "Introduction: I build thoughtful software.",
        "Note: Based in London.",
      ].join("\n\n"),
      keywords: ["Freeman", "Profile"],
    },
  ]);
  assert.deepEqual(buildContentBlockDocuments(blocks[1]), [
    {
      sourceType: "content_blocks",
      sourceId: "block-philosophy",
      documentIndex: 0,
      title: "Engineering philosophy",
      category: "Profile",
      url: "/",
      content: "What makes software worth using?",
      keywords: ["Engineering philosophy", "Profile"],
    },
  ]);
  assert.deepEqual(buildContentBlockDocuments(blocks[2]), [
    {
      sourceType: "content_blocks",
      sourceId: "block-direction",
      documentIndex: 0,
      title: "Current direction",
      category: "Profile",
      url: "/",
      content: [
        "Building search experiences.",
        "With careful indexing and retrieval.",
      ].join("\n\n"),
      keywords: ["Current direction", "Profile"],
    },
  ]);
  assert.deepEqual(buildContentBlockDocuments(blocks[3]), [
    {
      sourceType: "content_blocks",
      sourceId: "block-about-header",
      documentIndex: 0,
      title: "About Freeman",
      category: "Profile",
      url: "/about",
      content: "A little more about how I work.",
      keywords: ["About", "Freeman", "Profile"],
    },
  ]);
  assert.deepEqual(buildContentBlockDocuments(blocks[4]), [
    {
      sourceType: "content_blocks",
      sourceId: "block-education",
      documentIndex: 0,
      title: "Education",
      category: "Education",
      url: "/about",
      content: [
        "Current education: Software engineering",
        "Previous education: Computer science",
        "Research: Human-centred AI",
        "Additional context: Always learning by building.",
      ].join("\n\n"),
      keywords: ["Education", "Research"],
    },
  ]);
  assert.deepEqual(buildContentBlockDocuments(blocks[5]), [
    {
      sourceType: "content_blocks",
      sourceId: "block-intro",
      documentIndex: 0,
      title: "About Freeman",
      category: "Profile",
      url: "/about",
      content: "I care about clarity, craft and momentum.",
      keywords: ["About", "Freeman", "Profile"],
    },
  ]);
  assert.deepEqual(buildContentBlockDocuments(blocks[6]), [
    {
      sourceType: "content_blocks",
      sourceId: "block-process",
      documentIndex: 0,
      title: "How I work",
      category: "Work Process",
      url: "/about",
      content: "Understand, simplify, build, learn.",
      keywords: ["Engineering process", "Work Process"],
    },
  ]);
  assert.deepEqual(buildContentBlockDocuments(blocks[7]), [
    {
      sourceType: "content_blocks",
      sourceId: "block-outside",
      documentIndex: 0,
      title: "Writing",
      category: "Outside Engineering",
      url: "/about",
      content: "I write to make complex ideas easier to share.",
      keywords: ["Outside Engineering", "Writing"],
    },
  ]);
});

test("buildContentBlockDocuments rejects unknown, mismatched and malformed blocks", () => {
  const base = {
    id: "block-invalid",
    key: "home.hero",
    page: "HOME",
    section: "HERO",
    position: 0,
    content: {
      name: "Freeman",
      headline: "Headline",
      intro: "Intro",
      heroNote: "Note",
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies ContentBlock;

  assert.deepEqual(
    buildContentBlockDocuments({ ...base, key: "home.unknown" }),
    [],
  );
  assert.deepEqual(
    buildContentBlockDocuments({ ...base, page: "ABOUT" }),
    [],
  );
  assert.deepEqual(
    buildContentBlockDocuments({ ...base, content: { name: "Freeman" } }),
    [],
  );
});

test("content block UI-only fields do not change search output", () => {
  const base = {
    id: "block-ui",
    key: "home.philosophy",
    page: "HOME",
    section: "PHILOSOPHY",
    position: 1,
    content: { philosophyQuestion: "What makes software worth using?" },
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies ContentBlock;

  const changedUiFields = {
    ...base,
    position: 99,
    updatedAt: new Date("2026-07-20T00:00:00.000Z"),
  } satisfies ContentBlock;

  assert.deepEqual(
    buildContentBlockDocuments(base),
    buildContentBlockDocuments(changedUiFields),
  );
});
