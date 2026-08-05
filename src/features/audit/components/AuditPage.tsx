"use client";

import type { AuditPageData } from "@/contracts/audit-page.contract";
import { AuditDeliverable } from "./AuditDeliverable";
import { AuditFinalCta } from "./AuditFinalCta";
import { AuditHero } from "./AuditHero";
import { AuditProblemSignals } from "./AuditProblemSignals";
import { AuditProof } from "./AuditProof";

export function AuditPage({ data }: { data: AuditPageData }) {
  return <main className="overflow-hidden"><AuditHero hero={data.hero} /><AuditProblemSignals signals={data.problemSignals} /><AuditDeliverable deliverable={data.deliverable} /><AuditProof proof={data.proof} /><AuditFinalCta cta={data.finalCta} /></main>;
}
