import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/shared/components/ui/Button";
import { cn } from "@/shared/utils/class-names";

export const marketingCtaClasses = cn(
  buttonVariants({ size: "lg", variant: "signal" }),
  "mx-auto mt-10 w-full max-w-lg gap-5",
);

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
