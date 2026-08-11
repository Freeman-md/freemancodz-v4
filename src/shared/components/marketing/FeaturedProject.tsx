import type { ReactNode } from "react";

import { cn } from "@/shared/utils/class-names";

export function FeaturedProject({
  actions,
  children,
  className,
  meta,
  title,
  visual,
}: {
  actions: ReactNode;
  children: ReactNode;
  className?: string;
  meta: ReactNode;
  title: ReactNode;
  visual: ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-soft lg:grid lg:min-h-[31rem] lg:grid-cols-[42%_58%]",
        className,
      )}
    >
      <div className="order-2 flex min-w-0 flex-col p-6 sm:p-8 lg:order-1 lg:p-10">
        <div className="flex flex-wrap items-center gap-3">{meta}</div>
        <h3 className="mt-6 font-display text-4xl leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
          {title}
        </h3>
        <div className="mt-8 grid gap-6">{children}</div>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 lg:mt-auto lg:pt-8">
          {actions}
        </div>
      </div>
      <div className="relative order-1 min-h-[22rem] overflow-hidden border-b border-line bg-slate-50 lg:order-2 lg:min-h-full lg:border-b-0 lg:border-l">
        {visual}
      </div>
    </article>
  );
}
