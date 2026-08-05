import assert from "node:assert/strict";
import test from "node:test";
import type {
  ContentBlock,
  Experience,
  Principle,
  Project,
  Service,
} from "@/generated/prisma/client";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import { chunkText, prepareSiteChunks } from "@/server/modules/search-index/chunking/text-chunker";
import type {
  ISearchIndexJobRepository,
  SearchIndexJob,
} from "@/server/modules/search-index/interfaces/search-index-job.repository.interface";
import type {
  ISourceRecordRepository,
  SourceRecord,
} from "@/server/modules/search-index/interfaces/source-record.repository.interface";
import type { ISiteChunkRepository } from "@/server/modules/search-index/interfaces/site-chunk.repository.interface";
import { mapContentBlockDocument } from "@/server/modules/search-index/mappers/content-block-document.mapper";
import { audit } from "../../../content/portfolio/audit";
import { mapSourceDocument } from "@/server/modules/search-index/mappers/source-document.mapper";
import { SearchIndexService } from "@/server/modules/search-index/services/search-index.service";

const project = {
  id: "project-1",
  key: "project-1",
  title: "Pay4Me",
  summary: "Payments for students.",
  category: "Fintech",
  role: "Engineer",
  outcome: "Reliable payments.",
  detail: "Built the payment flow.",
  future: null,
  collaboration: null,
  positioning: null,
  featured: false,
  position: 1,
  stacks: ["TypeScript"],
  links: [],
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies Project;

const service = {
  id: "service-1",
  key: "service-1",
  title: "Product strategy",
  lead: "Find the practical next step.",
  description: "Freeman helps teams shape product systems.",
  cta: "Talk to Freeman",
  assistantPrompt: null,
  position: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies Service;

const experience = {
  id: "experience-1",
  key: "experience-1",
  title: "Platform engineer",
  company: "Northstar",
  dates: "2024-2026",
  location: "London",
  category: "Engineering",
  focus: "Reliable systems",
  position: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies Experience;

const principle = {
  id: "principle-1",
  key: "principle-1",
  section: "home",
  title: "Useful software",
  body: "Software should make a practical difference.",
  position: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies Principle;

test("project mapping explicitly identifies Freeman's project", () => {
  const document = mapSourceDocument({ sourceType: "projects", record: project });

  assert.match(document.paragraphs[0] ?? "", /Project: Pay4Me\. Freeman built/);
  assert.equal(document.sourceType, "projects");
});
test("content blocks use descriptive titles and invalid blocks fail visibly", () => {
  const block = {
    id: "block-1",
    key: "about.header",
    page: "ABOUT",
    section: "ABOUT_HEADER",
    position: 1,
    content: { aboutHeadline: "builds thoughtful software." },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ContentBlock;

  assert.equal(mapContentBlockDocument(block).title, "About Freeman");
  assert.throws(
    () => mapContentBlockDocument({ ...block, key: "unknown" }),
    /Unsupported or invalid/,
  );

  const numericIntro = mapContentBlockDocument({
    ...block,
    key: "about.intro.0",
    section: "ABOUT_INTRO",
    content: { body: "Freeman builds reliable product systems for teams." },
  });

  assert.match(numericIntro.title, /reliable product systems/i);
  assert.doesNotMatch(numericIntro.title, /: 0$/);
  assert.ok(numericIntro.keywords.some((keyword) => /reliable product systems/i.test(keyword)));
});
test("new homepage content blocks map to meaningful search documents", () => {
  const base = {
    id: "homepage-block",
    page: "HOME",
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ContentBlock;

  const documents = [
    mapContentBlockDocument({
      ...base,
      key: "home.services-intro",
      section: "SERVICES_INTRO",
      content: { title: "What I Help Improve", copy: "Customer journeys and workflows." },
    }),
    mapContentBlockDocument({
      ...base,
      key: "home.proof-of-work",
      section: "PROOF_OF_WORK",
      content: {
        title: "Proof of Work",
        copy: "Real products.",
        items: [
          { projectKey: "pay4me-withradius", action: { type: "external", label: "View", href: "https://pay4me.app" } },
        ],
      },
    }),
    mapContentBlockDocument({
      ...base,
      key: "home.audit-offer",
      section: "AUDIT_OFFER",
      content: {
        label: "Free Customer Journey & Workflow Audit",
        title: "Find friction.",
        copy: "Review opportunities.",
        actionLabel: "Get a Free Audit",
        actionHref: "/audit",
        checklist: ["Customer journey friction", "Manual work"],
      },
    }),
    mapContentBlockDocument({
      ...base,
      key: "home.final-cta",
      section: "FINAL_CTA",
      content: {
        title: "Not sure where customers are getting stuck?",
        primaryLabel: "Get a Free Audit",
        primaryHref: "/audit",
        secondaryLabel: "View My Work",
        secondaryHref: "/work",
      },
    }),
  ];

  assert.deepEqual(
    documents.map((document) => document.title),
    [
      "What I Help Improve",
      "Proof of Work",
      "Free Customer Journey & Workflow Audit",
      "Freeman's next steps",
    ],
  );
  assert.match(documents[1]?.paragraphs.join(" ") ?? "", /pay4me-withradius/);
  assert.match(documents[2]?.paragraphs.join(" ") ?? "", /Customer journey friction/);
});

test("all audit content blocks map to the Audit search document", () => {
  const base = { id: "audit-block", page: "AUDIT", position: 0, createdAt: new Date(), updatedAt: new Date() } as ContentBlock;

  const documents = audit.map((record) => mapContentBlockDocument({ ...base, key: record.key, section: record.section as never, content: record.content as never }));

  assert.deepEqual(documents.map((document) => document.url), ["/audit", "/audit", "/audit", "/audit", "/audit"]);
  assert.ok(documents.every((document) => document.paragraphs.length > 0));
});
test("all supported source records map to meaningful source-specific text", () => {
  const documents = [
    mapSourceDocument({ sourceType: "services", record: service }),
    mapSourceDocument({ sourceType: "experiences", record: experience }),
    mapSourceDocument({ sourceType: "principles", record: principle }),
  ];

  assert.match(documents[0]?.paragraphs.join(" ") ?? "", /Service: Freeman offers/);
  assert.match(documents[1]?.paragraphs.join(" ") ?? "", /Experience: Freeman worked as/);
  assert.match(documents[2]?.paragraphs.join(" ") ?? "", /Principle: Freeman values/);
});
test("paragraph-first chunking is deterministic and splits oversized paragraphs", () => {
  const short = ["One paragraph.", "Two paragraphs."];

  assert.deepEqual(chunkText(short), ["One paragraph.\n\nTwo paragraphs."]);
  const oversized = `${"Sentence. ".repeat(250)}end`;

  assert.ok(chunkText([oversized]).every((chunk) => chunk.length <= 1200));
  assert.deepEqual(chunkText([oversized]), chunkText([oversized]));
  assert.ok(chunkText(["x".repeat(1_201)]).every((chunk) => chunk.length <= 1200));
});

function makeService({
  record = { sourceType: "projects" as const, record: project } as Awaited<
    ReturnType<ISourceRecordRepository["findById"]>
  >,
  existing = [] as Awaited<ReturnType<ISiteChunkRepository["findBySource"]>>,
  embeddings = [[0, 1]],
  replace = async () => undefined,
}: {
  record?: Awaited<ReturnType<ISourceRecordRepository["findById"]>>;
  existing?: Awaited<ReturnType<ISiteChunkRepository["findBySource"]>>;
  embeddings?: number[][];
  replace?: ISiteChunkRepository["replaceSource"];
} = {}) {
  let embeddingCalls = 0;

  const sources: ISourceRecordRepository = {
    findById: async () => record,
    findAll: async () => (record ? [record] : []),
  };

  const chunks: ISiteChunkRepository = {
    findBySource: async () => existing,
    replaceSource: replace,
    deleteSource: async () => 2,
    match: async () => [],
    clear: async () => undefined,
  };

  const jobs: ISearchIndexJobRepository = {
    claim: async () => [],
    complete: async () => null,
    fail: async () => null,
    getStatus: async () => ({}) as never,
    clear: async () => undefined,
  };

  const service = new SearchIndexService(
    sources,
    chunks,
    jobs,
    {
      getEmbeddingModel: () => "model",
      createEmbedding: async () => [],
      createEmbeddings: async (inputs) => {
        embeddingCalls += 1;

        return inputs.map((_, index) => ({
          embedding: embeddings[index] ?? Array(1536).fill(0),
          embeddingModel: "model",
        }));
      },
      streamResponse: async () => ({}) as never,
    },
    { info: () => undefined, error: () => undefined },
  );

  return { service, embeddingCalls: () => embeddingCalls };
}

test("unchanged sources do not embed or write and changed sources replace all chunks", async () => {
  const prepared = prepareSiteChunks(
    mapSourceDocument({ sourceType: "projects", record: project }),
  );

  const unchanged = makeService({
    existing: prepared.map((chunk) => ({
      chunkIndex: chunk.chunkIndex,
      contentHash: chunk.contentHash,
      embeddingModel: "model",
    })),
  });

  assert.equal(
    (await unchanged.service.indexSource({ sourceType: "projects", sourceId: project.id }))
      .unchanged,
    1,
  );
  assert.equal(unchanged.embeddingCalls(), 0);
  let replaced = 0;

  const changed = makeService({
    embeddings: [Array(1536).fill(0)],
    replace: async () => {
      replaced += 1;
    },
  });

  await changed.service.indexSource({ sourceType: "projects", sourceId: project.id });
  assert.equal(changed.embeddingCalls(), 1);
  assert.equal(replaced, 1);
});
test("deleted sources remove their chunks", async () => {
  const { service } = makeService({ record: null });

  assert.equal(
    (await service.indexSource({ sourceType: "projects", sourceId: project.id })).deleted,
    2,
  );
});

const failedJob = {
  id: "job-1",
  operation: "upsert",
  sourceType: "projects",
  sourceId: project.id,
  status: "processing",
  attempts: 1,
  availableAt: new Date(),
  claimedAt: new Date(),
  lastError: null,
  createdAt: new Date(),
  processedAt: null,
} satisfies SearchIndexJob;

function createServiceForFailure({
  source = { sourceType: "projects", record: project } as SourceRecord,
  embeddings = async () => [{ embedding: Array(1536).fill(0), embeddingModel: "model" }],
  replaceSource = async () => undefined,
}: {
  source?: SourceRecord;
  embeddings?: IOpenAIProvider["createEmbeddings"];
  replaceSource?: ISiteChunkRepository["replaceSource"];
}) {
  const errors: unknown[] = [];

  const jobs: ISearchIndexJobRepository = {
    claim: async () => [failedJob],
    complete: async () => null,
    fail: async (_id, error) => {
      errors.push(error);

      return { ...failedJob, status: "failed" };
    },
    getStatus: async () => ({}) as never,
    clear: async () => undefined,
  };

  const sourceRepository: ISourceRecordRepository = {
    findById: async () => source,
    findAll: async () => [source],
  };

  const chunkRepository: ISiteChunkRepository = {
    findBySource: async () => [],
    replaceSource,
    deleteSource: async () => 0,
    match: async () => [],
    clear: async () => undefined,
  };

  const openai: IOpenAIProvider = {
    getEmbeddingModel: () => "model",
    createEmbedding: async () => [],
    createEmbeddings: embeddings,
    streamResponse: async () => ({}) as never,
  };

  const logger: ILogger = { info: () => undefined, error: () => undefined };

  return {
    service: new SearchIndexService(sourceRepository, chunkRepository, jobs, openai, logger),
    errors,
  };
}

test("pending jobs safely fail for mapping, embedding, and persistence errors", async () => {
  const invalidBlock = {
    id: "broken-block",
    key: "unknown",
    page: "ABOUT",
    section: "ABOUT_HEADER",
    position: 1,
    content: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ContentBlock;

  const cases = [
    createServiceForFailure({ source: { sourceType: "content_blocks", record: invalidBlock } }),
    createServiceForFailure({
      embeddings: async () => {
        throw new Error("embedding unavailable");
      },
    }),
    createServiceForFailure({
      replaceSource: async () => {
        throw new Error("transaction failed");
      },
    }),
  ];

  for (const current of cases) {
    assert.deepEqual(await current.service.processPendingJobs(), {
      claimed: 1,
      completed: 0,
      retried: 0,
      failed: 1,
    });
    assert.equal(current.errors.length, 1);
  }
});

test("clean rebuild clears stale state, uses indexing, and reports success and failure summaries", async () => {
  const events: string[] = [];

  const sources: SourceRecord[] = [
    { sourceType: "projects", record: project },
    { sourceType: "services", record: service },
  ];

  const sourceRepository: ISourceRecordRepository = {
    findById: async (sourceType, sourceId) =>
      sources.find((source) => source.sourceType === sourceType && source.record.id === sourceId) ??
      null,
    findAll: async () => {
      events.push("find-sources");

      return sources;
    },
  };

  const chunks: ISiteChunkRepository = {
    findBySource: async () => [],
    replaceSource: async () => {
      events.push("replace");
    },
    deleteSource: async () => 0,
    match: async () => [],
    clear: async () => {
      events.push("clear-chunks");
    },
  };

  const jobs: ISearchIndexJobRepository = {
    claim: async () => [],
    complete: async () => null,
    fail: async () => null,
    getStatus: async () => ({}) as never,
    clear: async () => {
      events.push("clear-jobs");
    },
  };

  const openai: IOpenAIProvider = {
    getEmbeddingModel: () => "model",
    createEmbedding: async () => [],
    createEmbeddings: async (inputs) =>
      inputs.map(() => ({ embedding: Array(1536).fill(0), embeddingModel: "model" })),
    streamResponse: async () => ({}) as never,
  };

  const rebuilt = new SearchIndexService(sourceRepository, chunks, jobs, openai, {
    info: () => undefined,
    error: () => undefined,
  });

  const result = await rebuilt.rebuild({ clean: true });

  assert.deepEqual(events, [
    "find-sources",
    "clear-chunks",
    "clear-jobs",
    "find-sources",
    "replace",
    "replace",
  ]);
  assert.deepEqual(result.summary, {
    sourceRecords: 2,
    sourcesIndexed: 2,
    sourcesSkipped: 0,
    chunksCreated: 2,
    embeddingsGenerated: 2,
    sourcesFailed: 0,
  });

  const invalidSource = {
    sourceType: "content_blocks" as const,
    record: {
      id: "bad",
      key: "unknown",
      page: "ABOUT",
      section: "ABOUT_HEADER",
      position: 1,
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ContentBlock,
  };

  const failingSources: ISourceRecordRepository = {
    findById: async () => invalidSource,
    findAll: async () => [invalidSource],
  };

  const failing = new SearchIndexService(failingSources, chunks, jobs, openai, {
    info: () => undefined,
    error: () => undefined,
  });

  await assert.rejects(failing.rebuild({ clean: true }), (error: unknown) =>
    Boolean(
      error &&
      typeof error === "object" &&
      "summary" in error &&
      (error as { summary: { sourcesFailed: number } }).summary.sourcesFailed === 1,
    ),
  );
});
