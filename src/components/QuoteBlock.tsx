import type { ReactNode } from "react";

export function QuoteBlock({ children }: { children: ReactNode }) {
  return (
    <blockquote className="mx-auto max-w-4xl border-l-4 border-black pl-8 text-left text-3xl font-medium leading-[1.4] tracking-[-0.03em] text-ink md:text-[32px]">
      {children}
    </blockquote>
  );
}
