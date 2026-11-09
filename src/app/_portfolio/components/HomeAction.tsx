import type { ReactNode } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";

export function HomeAction({
  children,
  href,
  down = false,
}: {
  children: ReactNode;
  href: string;
  down?: boolean;
}) {
  const Icon = down ? ArrowDown : ArrowUpRight;

  return (
    <a className="home-action" href={href}>
      {children}
      <Icon aria-hidden="true" size={16} />
    </a>
  );
}
