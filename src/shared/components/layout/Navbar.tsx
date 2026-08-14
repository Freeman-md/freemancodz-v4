"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Bot, Menu, X } from "lucide-react";
import { assistantTriggerEvent } from "@/contracts/assistant.contract";
import { Container } from "@/shared/components/layout/Container";
import { Button, buttonVariants } from "@/shared/components/ui/Button";

const navigation = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Audit", href: "/audit" },
] as const;

export function Navbar({ linkedInUrl }: { linkedInUrl: string }) {
  const pathname = usePathname();

  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <nav className="relative">
        <Container className="grid h-16 grid-cols-[1fr_auto] items-center md:grid-cols-[1fr_auto_1fr]">
          <Link
            href="/"
            aria-label="Freemancodz home"
            className="group block shrink-0 md:justify-self-start"
          >
            <span className="relative block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Freemancodz" className="block h-6 w-auto md:h-7" src="/images/logo.svg" />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-violet-600 opacity-0 transition-opacity duration-200 [clip-path:inset(0_0_0_91%)] [mask-image:url('/images/logo.svg')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] group-hover:opacity-100"
              />
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex md:justify-self-center">
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
          <div className="hidden md:block md:justify-self-end">
            {isHome ? (
              <Button
                className="font-mono text-[12px]"
                size="sm"
                type="button"
                variant="outline"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent(assistantTriggerEvent, {
                      detail: {
                        message: "I would like to talk about something I am working on.",
                      },
                    }),
                  );
                }}
              >
                <Bot aria-hidden="true" className="size-4" />
                Assistant
              </Button>
            ) : pathname === "/audit" ? (
              <Button
                className="h-9 px-4 font-mono text-[11px]"
                size="sm"
                variant="signal"
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
                href={linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({
                  className: "font-mono text-[12px]",
                  size: "sm",
                  variant: "outline",
                })}
              >
                LinkedIn
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
          <details className="group justify-self-end md:hidden">
            <summary className="flex size-11 cursor-pointer list-none items-center justify-center text-ink [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Toggle navigation</span>
              <Menu aria-hidden="true" className="size-7 group-open:hidden" />
              <X aria-hidden="true" className="hidden size-7 group-open:block" />
            </summary>
            <div className="absolute inset-x-0 top-full border-t border-line bg-white py-6 shadow-soft">
              <Container className="grid gap-1">
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
              </Container>
            </div>
          </details>
        </Container>
      </nav>
    </header>
  );
}
