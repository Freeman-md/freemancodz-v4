import { AuditFooterCta } from "@/features/audit/components/AuditFooterCta";
import { AuditHero } from "@/features/audit/components/AuditHero";
import { AuditProofSection } from "@/features/audit/components/AuditProofSection";
import { AuditSymptomsSection } from "@/features/audit/components/AuditSymptomsSection";
import { BeforeAfterSection } from "@/features/audit/components/BeforeAfterSection";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Free Customer Journey & Workflow Audit | Freeman Madudili", description: "Identify where customers are getting stuck or repetitive work is slowing your business down. Start with one journey or workflow and get a focused visual diagnosis." };

export default function Audit() {
  return <>
    <AuditHero />
    <AuditSymptomsSection />
    <BeforeAfterSection />
    <AuditProofSection />
    <AuditFooterCta />
  </>;
}
