import type { ReactNode } from "react";
export function QuoteBlock({ children }: { children: ReactNode }) { return <blockquote className="border-l-4 border-black bg-white py-3 pl-8 text-2xl font-semibold leading-tight tracking-[-0.04em] text-black md:pl-16 md:text-4xl">{children}</blockquote>; }
