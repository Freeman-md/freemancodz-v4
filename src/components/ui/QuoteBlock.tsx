import type { ReactNode } from "react";

export function QuoteBlock({ children }: { children: ReactNode }) {
  return (
    <blockquote className="max-w-4xl text-left font-display text-[2.1rem] leading-[1.22] tracking-[-0.02em] text-ink md:text-[3rem]">
      <span className="text-accent/65">&ldquo;</span>
      <span className="px-2 italic">{children}</span>
      <span className="text-accent/65">&rdquo;</span>
    </blockquote>
  );
}
