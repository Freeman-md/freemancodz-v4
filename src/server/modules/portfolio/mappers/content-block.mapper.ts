import type { ContentBlock, ContentPage, ContentSection } from "@/generated/prisma/client";
import {
  auditDeliverableContentSchema,
  auditFinalCtaContentSchema,
  auditHeroContentSchema,
  auditProblemSignalsContentSchema,
  auditProofContentSchema,
  aboutHeaderContentSchema,
  currentDirectionContentSchema,
  educationContentSchema,
  heroContentSchema,
  homeAuditOfferContentSchema,
  homeFinalCtaContentSchema,
  homeProofOfWorkContentSchema,
  homeServicesIntroContentSchema,
  outsideEngineeringContentSchema,
  parseStoredContent,
  philosophyContentSchema,
  textBlockContentSchema,
} from "@/server/modules/portfolio/schemas/content-block.schema";

export function assertContentBlockIdentity(
  block: ContentBlock,
  expected: { key: string; page: ContentPage; section: ContentSection },
) {
  if (
    block.key !== expected.key ||
    block.page !== expected.page ||
    block.section !== expected.section
  ) {
    throw new Error(`Unexpected content block identity: ${expected.key}`);
  }
}

export function mapHeroBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "home.hero", page: "HOME", section: "HERO" });

  return parseStoredContent(heroContentSchema, block.content, block.key);
}

export function mapHomeServicesIntroBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, {
    key: "home.services-intro",
    page: "HOME",
    section: "SERVICES_INTRO",
  });

  return parseStoredContent(homeServicesIntroContentSchema, block.content, block.key);
}

export function mapHomeProofOfWorkBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, {
    key: "home.proof-of-work",
    page: "HOME",
    section: "PROOF_OF_WORK",
  });

  return parseStoredContent(homeProofOfWorkContentSchema, block.content, block.key);
}

export function mapHomeAuditOfferBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, {
    key: "home.audit-offer",
    page: "HOME",
    section: "AUDIT_OFFER",
  });

  return parseStoredContent(homeAuditOfferContentSchema, block.content, block.key);
}

export function mapHomeFinalCtaBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, { key: "home.final-cta", page: "HOME", section: "FINAL_CTA" });

  return parseStoredContent(homeFinalCtaContentSchema, block.content, block.key);
}

export function mapAuditHeroBlock(block: ContentBlock) { assertContentBlockIdentity(block, { key: "audit.hero", page: "AUDIT", section: "HERO" });

 return parseStoredContent(auditHeroContentSchema, block.content, block.key); }

export function mapAuditProblemSignalsBlock(block: ContentBlock) { assertContentBlockIdentity(block, { key: "audit.problem-signals", page: "AUDIT", section: "AUDIT_PROBLEM_SIGNALS" });

 return parseStoredContent(auditProblemSignalsContentSchema, block.content, block.key); }

export function mapAuditDeliverableBlock(block: ContentBlock) { assertContentBlockIdentity(block, { key: "audit.deliverable", page: "AUDIT", section: "AUDIT_DELIVERABLE" });

 return parseStoredContent(auditDeliverableContentSchema, block.content, block.key); }

export function mapAuditProofBlock(block: ContentBlock) { assertContentBlockIdentity(block, { key: "audit.proof", page: "AUDIT", section: "AUDIT_PROOF" });

 return parseStoredContent(auditProofContentSchema, block.content, block.key); }

export function mapAuditFinalCtaBlock(block: ContentBlock) { assertContentBlockIdentity(block, { key: "audit.final-cta", page: "AUDIT", section: "FINAL_CTA" });

 return parseStoredContent(auditFinalCtaContentSchema, block.content, block.key); }

export function mapPhilosophyBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, {
    key: "home.philosophy",
    page: "HOME",
    section: "PHILOSOPHY",
  });

  return parseStoredContent(philosophyContentSchema, block.content, block.key);
}

export function mapCurrentDirectionBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, {
    key: "home.current-direction",
    page: "HOME",
    section: "CURRENT_DIRECTION",
  });

  return parseStoredContent(currentDirectionContentSchema, block.content, block.key);
}

export function mapAboutHeaderBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, {
    key: "about.header",
    page: "ABOUT",
    section: "ABOUT_HEADER",
  });

  return parseStoredContent(aboutHeaderContentSchema, block.content, block.key);
}

export function mapEducationBlock(block: ContentBlock) {
  assertContentBlockIdentity(block, {
    key: "about.education",
    page: "ABOUT",
    section: "EDUCATION",
  });

  return parseStoredContent(educationContentSchema, block.content, block.key);
}

export function mapTextBlock(block: ContentBlock) {
  return parseStoredContent(textBlockContentSchema, block.content, block.key);
}

export function mapOutsideEngineeringBlock(block: ContentBlock) {
  return parseStoredContent(outsideEngineeringContentSchema, block.content, block.key);
}
