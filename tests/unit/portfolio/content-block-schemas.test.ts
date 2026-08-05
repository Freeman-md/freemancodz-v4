import assert from "node:assert/strict";
import test from "node:test";
import { aboutHeaderContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { currentDirectionContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { educationContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { heroContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { homeAuditOfferContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { homeFinalCtaContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { homeProofOfWorkContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { homeServicesIntroContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { outsideEngineeringContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { philosophyContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { textBlockContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { auditDeliverableContentSchema, auditFinalCtaContentSchema, auditHeroContentSchema, auditProblemSignalsContentSchema, auditProofContentSchema } from "@/server/modules/portfolio/schemas/content-block.schema";
import { audit } from "../../../content/portfolio/audit";

const schemas = [
  [
    heroContentSchema,
    {
      name: "Freeman",
      headline: "Headline",
      intro: "Intro",
      heroNote: "Note",
      primaryLabel: "Audit",
      primaryHref: "/audit",
      secondaryLabel: "Work",
      secondaryHref: "/work",
    },
  ],
  [philosophyContentSchema, { philosophyQuestion: "Question" }],
  [
    currentDirectionContentSchema,
    { currentDirection: "Direction", currentDirectionSupport: "Support" },
  ],
  [aboutHeaderContentSchema, { aboutHeadline: "About" }],
  [
    educationContentSchema,
    { current: "Current", previous: "Previous", research: "Research", support: "Support" },
  ],
  [textBlockContentSchema, { body: "Body" }],
  [outsideEngineeringContentSchema, { title: "Strength", description: "Training" }],
] as const;

test("content block schemas accept valid seeded payload shapes", () => {
  for (const [schema, payload] of schemas) {
    assert.deepEqual(schema.parse(payload), payload);
  }
});

test("content block schemas reject missing required fields", () => {
  for (const [schema] of schemas) {
    assert.equal(schema.safeParse({}).success, false);
  }
});

test("content block schemas reject incorrect field types", () => {
  for (const [schema, payload] of schemas) {
    const [field] = Object.keys(payload);

    assert.equal(schema.safeParse({ ...payload, [field]: 1 }).success, false);
  }
});

test("homepage conversion schemas accept their supported payloads", () => {
  const payloads = [
    [homeServicesIntroContentSchema, { title: "What I Help Improve", copy: "Customer journeys." }],
    [
      homeProofOfWorkContentSchema,
      {
        title: "Proof of Work",
        copy: "Evidence.",
        items: [
          {
            projectKey: "portfolio-assistant",
            action: { type: "assistant", label: "Try", prompt: "Help me." },
          },
          { projectKey: "email-pa", action: null },
        ],
      },
    ],
    [
      homeAuditOfferContentSchema,
      {
        label: "Free Audit",
        title: "Find friction.",
        copy: "Review it.",
        actionLabel: "Start",
        actionHref: "/audit",
        checklist: ["Customer journey friction"],
      },
    ],
    [
      homeFinalCtaContentSchema,
      {
        title: "Need help?",
        primaryLabel: "Audit",
        primaryHref: "/audit",
        secondaryLabel: "Work",
        secondaryHref: "/work",
      },
    ],
  ] as const;

  for (const [schema, payload] of payloads) {
    assert.deepEqual(schema.parse(payload), payload);
  }
});

test("homepage conversion schemas reject malformed required payloads", () => {
  assert.equal(homeServicesIntroContentSchema.safeParse({ title: "Missing copy" }).success, false);
  assert.equal(
    homeProofOfWorkContentSchema.safeParse({ title: "Proof", copy: "Copy", items: [{}] }).success,
    false,
  );
  assert.equal(
    homeAuditOfferContentSchema.safeParse({
      label: "Audit",
      title: "Title",
      copy: "Copy",
      actionLabel: "Start",
      actionHref: "/audit",
      checklist: [],
    }).success,
    false,
  );
  assert.equal(
    homeFinalCtaContentSchema.safeParse({
      title: "Title",
      primaryLabel: "Audit",
      primaryHref: "/audit",
      secondaryLabel: "Work",
    }).success,
    false,
  );
});

test("audit content schemas enforce the approved bounded page shapes", () => {
  const [heroRecord, signalsRecord, deliverableRecord, proofRecord, finalCtaRecord] = audit.map((block) => block.content);

  const hero = auditHeroContentSchema.parse(heroRecord);

  const signals = auditProblemSignalsContentSchema.parse(signalsRecord);

  const deliverable = auditDeliverableContentSchema.parse(deliverableRecord);

  const proof = auditProofContentSchema.parse(proofRecord);

  const finalCta = auditFinalCtaContentSchema.parse(finalCtaRecord);

  assert.equal(auditHeroContentSchema.safeParse(hero).success, true);
  assert.equal(auditProblemSignalsContentSchema.safeParse(signals).success, true);
  assert.equal(auditDeliverableContentSchema.safeParse(deliverable).success, true);
  assert.equal(auditProofContentSchema.safeParse(proof).success, true);
  assert.equal(auditFinalCtaContentSchema.safeParse(finalCta).success, true);
  assert.equal(auditHeroContentSchema.safeParse({ ...hero, copy: undefined }).success, false);
  assert.equal(auditHeroContentSchema.safeParse({ ...hero, action: { ...hero.action, prompt: "x".repeat(501) } }).success, false);
  assert.equal(auditProblemSignalsContentSchema.safeParse({ ...signals, items: signals.items.slice(0, 3) }).success, false);
  assert.equal(auditDeliverableContentSchema.safeParse({ ...deliverable, process: deliverable.process.slice(0, 2) }).success, false);
  assert.equal(auditFinalCtaContentSchema.safeParse({ ...finalCta, action: {} }).success, false);
});
