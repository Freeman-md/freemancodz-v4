"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation, externalLinks } from "@/data/navigation";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-[-0.03em] text-ink transition hover:text-accent"
        >
          Portfolio
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 pb-1 font-mono text-[12px] tracking-[0.02em] transition ${
                  active
                    ? "border-ink text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <a
          href={externalLinks.linkedin}
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-sm border border-line px-4 py-2 font-mono text-[12px] text-ink transition hover:bg-surface md:inline-flex"
        >
          LinkedIn
        </a>
      </nav>
      <div className="flex justify-center gap-8 border-t border-line px-5 py-3 md:hidden">
        {navigation.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`font-mono text-[12px] ${active ? "text-ink" : "text-muted"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
