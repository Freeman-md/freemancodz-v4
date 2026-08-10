import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/shared/components/ui/Button";
import { cn } from "@/shared/utils/class-names";

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "accent" | "text" | "signal" | "light" | "success";
};

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
  ...props
}: LinkButtonProps) {
  const buttonVariant = {
    accent: "signal",
    ghost: "outline",
    light: "light",
    primary: "primary",
    signal: "signal",
    success: "success",
    text: "link",
  }[variant] as NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ size: variant === "text" ? "sm" : "lg", variant: buttonVariant }),
        "font-mono text-[12px] tracking-[0.02em]",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
