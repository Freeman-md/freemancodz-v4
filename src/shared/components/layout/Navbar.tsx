"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { assistantTriggerEvent } from "@/contracts/assistant.contract";
import { navigation, externalLinks } from "@/shared/config/links";
import { Button } from "@/shared/components/ui/Button";
import { siteConfig } from "@/shared/config/site-metadata";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-6">
        <Link
          href="/"
          className="font-display text-xl tracking-[-0.03em] text-ink transition hover:text-accent md:text-2xl"
        >
          {siteConfig.shortName}
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 pb-1 font-mono text-[12px] tracking-[0.02em] transition ${
                  active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="hidden md:block">
          {pathname === "/audit" ? (
            <Button
              className="h-9 px-4 font-mono text-[11px]"
              size="sm"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent(assistantTriggerEvent, {
                    detail: {
                      message:
                        "I would like to claim my free customer journey and workflow audit.",
                    },
                  }),
                );
              }}
            >
              Claim My Free Audit
              <ArrowRight size={13} strokeWidth={2.25} />
            </Button>
          ) : (
            <a
              href={externalLinks.linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-sm border border-line px-4 py-2 font-mono text-[12px] text-ink transition hover:bg-surface"
            >
              LinkedIn
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
        <details className="group md:hidden">
          <summary className="flex size-11 cursor-pointer list-none items-center justify-center text-ink [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Toggle navigation</span>
            <Menu aria-hidden="true" className="size-7 group-open:hidden" />
            <X aria-hidden="true" className="hidden size-7 group-open:block" />
          </summary>
          <div className="absolute inset-x-0 top-full border-t border-line bg-white px-5 py-6 shadow-soft">
            <div className="mx-auto grid max-w-[1200px] gap-1">
              {navigation.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-4 py-3 font-mono text-sm transition hover:bg-surface ${
                      active ? "bg-signal-50 text-signal-800" : "text-muted"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}
