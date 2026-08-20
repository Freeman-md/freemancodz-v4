import { PortfolioAction } from "@/features/portfolio/components/PortfolioAction";
import type { PortfolioAction as PortfolioActionModel } from "@/features/portfolio/models/portfolio-presentation";

export function AuditButton({
  className,
  action,
  entryPoint,
}: {
  className?: string;
  action: PortfolioActionModel;
  entryPoint: "audit-hero-cta" | "audit-footer-cta";
}) {
  return (
    <PortfolioAction
      action={action}
      assistantDetail={{
        workflowStart: {
          workflowId: "audit",
          originPage: "/audit",
          originEntry: entryPoint,
        },
      }}
      className={`mt-9 font-mono text-xs ${className ?? ""}`}
    />
  );
}
