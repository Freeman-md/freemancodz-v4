import type { ReactNode } from "react";

import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { cn } from "@/shared/utils/class-names";

type MarketingVisualCtaProps = {
  action: ReactNode;
  align?: "center" | "left" | "right";
  className?: string;
  copy: ReactNode;
  eyebrow: string;
  helper: ReactNode;
  id: string;
  title: ReactNode;
  visual: ReactNode;
};

export function MarketingVisualCta({
  action,
  align = "center",
  className,
  copy,
  eyebrow,
  helper,
  id,
  title,
  visual,
}: MarketingVisualCtaProps) {
  const actionAlignment = {
    center: "items-center text-center",
    left: "items-start text-left",
    right: "items-end text-right",
  }[align];

  return (
    <section aria-labelledby={id} className={cn("pb-20 pt-16 sm:pb-28 sm:pt-20", className)}>
      <Container>
        <div className="grid overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)] lg:items-center lg:gap-14 lg:p-16">
          <div className="lg:col-start-1 lg:row-start-1">
            <MarketingSectionHeading
              align={align}
              copy={copy}
              eyebrow={eyebrow}
              id={id}
              title={title}
            />
          </div>

          <div className="mt-10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">{visual}</div>

          <div
            className={cn(
              "mt-10 flex min-w-0 flex-col lg:col-start-1 lg:row-start-2",
              actionAlignment,
            )}
          >
            {action}
            {helper}
          </div>
        </div>
      </Container>
    </section>
  );
}
