import { AuditHero } from "./AuditHero";
import { AuditFooterCta } from "./AuditFooterCta";
import { AuditProofSection } from "./AuditProofSection";
import { AuditSymptomsSection } from "./AuditSymptomsSection";
import { BeforeAfterSection } from "./BeforeAfterSection";

export function AuditPage() {
  return (
    <>
      <AuditHero />
      <AuditSymptomsSection />
      <BeforeAfterSection />
      <AuditProofSection />
      <AuditFooterCta />
    </>
  );
}
