import type { ReactNode } from "react";

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-sm bg-surface px-3 py-1 font-mono text-[11px] text-muted">
      {children}
    </span>
  );
}
