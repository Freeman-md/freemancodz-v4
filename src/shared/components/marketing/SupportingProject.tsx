import type { ReactNode } from "react";

import { cn } from "@/shared/utils/class-names";

export function SupportingProject({
  actions,
  badge,
  children,
  className,
  title,
  visual,
}: {
  actions: ReactNode;
  badge: ReactNode;
  children: ReactNode;
  className?: string;
  title: ReactNode;
  visual: ReactNode;
}) {
  return (
    <article
      className={cn("rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6", className)}
    >
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,34%)] sm:items-stretch">
        <div className="order-2 flex min-w-0 flex-col sm:order-1">
          {badge}
          <h3 className="mt-4 font-display text-2xl leading-tight tracking-[-0.035em] text-slate-950 sm:text-3xl">
            {title}
          </h3>
          <div className="mt-5 grid gap-5">{children}</div>
          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">{actions}</div>
        </div>
        <div className="order-1 min-h-[15rem] overflow-hidden rounded-2xl border border-line bg-slate-50/50 p-3 sm:order-2 sm:p-4">
          {visual}
        </div>
      </div>
    </article>
  );
}
