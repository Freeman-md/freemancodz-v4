import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode; variant?: "primary" | "ghost" | "accent" };
export function Button({ href, children, variant = "primary", className = "", ...props }: Props) {
  const styles = { primary: "bg-black text-white hover:bg-ink", accent: "bg-accent text-white hover:bg-indigo-500", ghost: "border border-line bg-white text-ink hover:bg-surface" }[variant];
  return <Link href={href} className={`inline-flex items-center justify-center rounded px-5 py-3 font-mono text-xs font-semibold transition ${styles} ${className}`} {...props}>{children}</Link>;
}
