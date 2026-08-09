import { AuditHero } from "./AuditHero";
import { AuditSymptomsSection } from "./AuditSymptomsSection";
import { BeforeAfterSection } from "./BeforeAfterSection";

export function AuditPage() {
  return (
    <>
      <AuditHero />
      <AuditSymptomsSection />
      <BeforeAfterSection />
    </>
  );
}
