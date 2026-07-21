import type { ReactNode } from "react";

const serviceIcons: Record<string, ReactNode> = {
  "Customer-Facing Assistants": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M6 8.5a3.5 3.5 0 0 1 3.5-3.5h5A3.5 3.5 0 0 1 18 8.5v3A3.5 3.5 0 0 1 14.5 15H12l-3.5 3V15H9.5A3.5 3.5 0 0 1 6 11.5z" />
      <path d="M9.5 9.5h5" />
      <path d="M9.5 12h3.5" />
    </svg>
  ),
  "Operational Workflows": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect x="3" y="5" width="7" height="5" rx="1.5" />
      <rect x="14" y="14" width="7" height="5" rx="1.5" />
      <path d="M10 7.5h4a2 2 0 0 1 2 2V14" />
      <path d="m14 14 2 2 2-2" />
    </svg>
  ),
};

export function ServiceIcon({ title }: { title: string }) {
  return <>{serviceIcons[title] ?? null}</>;
}
