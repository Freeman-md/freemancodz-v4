import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "accent" | "text";
};

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
  ...props
}: Props) {
  const styles = {
    primary:
      "border border-black bg-black text-white hover:opacity-90",
    accent:
      "border border-accent bg-accent text-white hover:bg-indigo-500 hover:border-indigo-500",
    ghost:
      "border border-line bg-transparent text-ink hover:bg-surface",
    text: "text-ink hover:text-accent",
  }[variant];

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3 font-mono text-[12px] font-medium tracking-[0.02em] transition ${styles} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
