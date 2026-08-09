import { portfolioContent, type PortfolioContentScope } from "../../../../../content/portfolio";
import {
  auditDeliverableContentSchema,
  auditFinalCtaContentSchema,
  auditHeroContentSchema,
  auditProblemSignalsContentSchema,
  auditProofContentSchema,
  aboutHeaderContentSchema,
  educationContentSchema,
  heroContentSchema,
  homeAuditOfferContentSchema,
  homeFinalCtaContentSchema,
  homeProofOfWorkContentSchema,
  homeServicesIntroContentSchema,
  outsideEngineeringContentSchema,
  textBlockContentSchema,
} from "./content-block.schema";

const contentSchemas = {
  "audit.hero": auditHeroContentSchema,
  "audit.problem-signals": auditProblemSignalsContentSchema,
  "audit.deliverable": auditDeliverableContentSchema,
  "audit.proof": auditProofContentSchema,
  "audit.final-cta": auditFinalCtaContentSchema,
  "home.hero": heroContentSchema,
  "home.services-intro": homeServicesIntroContentSchema,
  "home.proof-of-work": homeProofOfWorkContentSchema,
  "home.audit-offer": homeAuditOfferContentSchema,
  "home.final-cta": homeFinalCtaContentSchema,
  "about.header": aboutHeaderContentSchema,
  "about.education": educationContentSchema,
} as const;

function assertUniqueKeys(records: { key: string }[], label: string) {
  const keys = new Set<string>();

  for (const record of records) {
    if (keys.has(record.key)) {throw new Error(`Duplicate stable key in ${label}: ${record.key}`);}

    keys.add(record.key);
  }
}

export function validatePortfolioContentScopes(scopes: PortfolioContentScope[]) {
  const selectedKeys = scopes.flatMap((scope) =>
    portfolioContent[scope].map((record) => ({ key: record.key })),
  );

  assertUniqueKeys(selectedKeys, "selected portfolio content");
  const contentBlocks = [
    ...(scopes.includes("home") ? portfolioContent.home : []),
    ...(scopes.includes("about") ? portfolioContent.about : []),
    ...(scopes.includes("audit") ? portfolioContent.audit : []),
  ];

  for (const block of contentBlocks) {
    const schema =
      contentSchemas[block.key as keyof typeof contentSchemas] ??
      (block.section === "ABOUT_INTRO" || block.section === "WORK_PROCESS"
        ? textBlockContentSchema
        : block.section === "OUTSIDE_ENGINEERING"
          ? outsideEngineeringContentSchema
          : undefined);

    if (!schema) {throw new Error(`Unsupported portfolio content block: ${block.key}`);}

    const result = schema.safeParse(block.content);

    if (!result.success)
      {throw new Error(`Invalid portfolio content block: ${block.key}`, { cause: result.error });}
  }
}
