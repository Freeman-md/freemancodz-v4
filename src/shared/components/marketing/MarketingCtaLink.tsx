import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/shared/utils/class-names";

export const marketingCtaClasses =
  "mx-auto mt-10 inline-flex min-h-20 w-full max-w-lg items-center justify-center gap-5 rounded-sm bg-signal-800 px-7 py-5 text-lg font-semibold text-white shadow-[0_12px_28px_-14px_rgba(55,48,163,0.72)] transition hover:bg-signal-900 sm:text-xl";

export function MarketingCtaLink({
  children,
  className,
  href,
}: {
  children: ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <Link className={cn(marketingCtaClasses, className)} href={href}>
      {children}
    </Link>
  );
}
