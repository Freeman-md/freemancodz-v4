import { PortfolioAction } from "@/features/portfolio/components/PortfolioAction";
import type { PortfolioAction as PortfolioActionModel } from "@/features/portfolio/models/portfolio-presentation";

export function AuditButton({
  className,
  action,
}: {
  className?: string;
  action: PortfolioActionModel;
}) {
  return (
    <PortfolioAction action={action} className={`mt-9 font-mono text-xs ${className ?? ""}`} />
  );
}
