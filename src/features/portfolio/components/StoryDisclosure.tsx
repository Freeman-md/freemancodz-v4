import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export function StoryDisclosure({
  title,
  children,
  id,
}: {
  title: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <details className="story-disclosure" id={id}>
      <summary>
        {title}
        <Plus aria-hidden="true" size={20} />
      </summary>
      <div className="story-disclosure-content">{children}</div>
    </details>
  );
}
