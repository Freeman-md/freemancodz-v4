import type { ReactNode } from "react";

export function SectionHeading({
  id,
  children,
  description,
}: {
  id: string;
  children: ReactNode;
  description?: string;
}) {
  return (
    <div className="home-section-heading">
      <h2 id={id} tabIndex={-1}>
        {children}
      </h2>
      {description && <p>{description}</p>}
    </div>
  );
}
