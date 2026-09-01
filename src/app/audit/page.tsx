import { AuditFooterCta } from "@/features/audit/components/AuditFooterCta";
import { AuditHero } from "@/features/audit/components/AuditHero";
import { AuditProcessSection } from "@/features/audit/components/AuditProcessSection";
import { AuditProofSection } from "@/features/audit/components/AuditProofSection";
import { AuditSymptomsSection } from "@/features/audit/components/AuditSymptomsSection";
import type { Metadata } from "next";
import { createAuditPresentationData } from "@/features/portfolio/portfolio-presentation.mapper";
import { getCachedAuditPageData } from "../_portfolio/portfolio-page-cache";

export const metadata: Metadata = {
  title: "Free Customer Journey & Workflow Audit | Freeman Madudili",
  description:
    "Identify where customers are getting stuck or repetitive work is slowing your business down. Start with one journey or workflow and get a focused visual diagnosis.",
};

export default async function Audit() {
  const presentation = createAuditPresentationData(await getCachedAuditPageData());

  return (
    <>
      <AuditHero hero={presentation.hero} />
      <AuditProcessSection process={presentation.process} />
      <AuditSymptomsSection symptoms={presentation.symptoms} />
      <AuditProofSection projects={presentation.projects} proof={presentation.proof} />
      <AuditFooterCta closing={presentation.closing} />
    </>
  );
}
