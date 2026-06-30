import type { ReactNode } from "react";

const serviceIcons: Record<string, ReactNode> = {
  "Build Products": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="M5 7h5v5H5z" />
    </svg>
  ),
  "Improve Systems": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M4 12h5l2-4 3 8 2-4h4" />
      <path d="M4 6h16" />
      <path d="M4 18h16" />
    </svg>
  ),
  "Automate Workflows": (
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
  "Design for Growth": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M5 16l4-4 3 3 7-7" />
      <path d="M14 8h5v5" />
      <path d="M5 20h14" />
    </svg>
  ),
};

export function ServiceIcon({ title }: { title: string }) {
  return <>{serviceIcons[title] ?? null}</>;
}
