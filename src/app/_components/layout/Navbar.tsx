"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import {
  type MouseEvent,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ThemeToggle } from "./ThemeToggle";
import "./navbar.css";

const links = [
  { hash: "#work", text: "Work" },
  { hash: "#experience", text: "Freeman" },
  { hash: "#contact", text: "Let’s talk" },
] as const;

type Phase = "closed" | "open" | "closing";
const mobileNavigation = "(max-width: 700px), (max-height: 530px) and (orientation: landscape)";

export function Navbar() {
  const [phase, setPhase] = useState<Phase>("closed");

  const header = useRef<HTMLElement>(null);

  const trigger = useRef<HTMLButtonElement>(null);

  const menu = useRef<HTMLElement>(null);

  const surface = useRef<HTMLDivElement>(null);

  const pendingHash = useRef<string | null>(null);

  const restoreFocus = useRef(false);

  const active = phase !== "closed";

  function close(hash?: string) {
    pendingHash.current = hash ?? null;
    restoreFocus.current = !hash;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    setPhase(reduce ? "closed" : "closing");
    trigger.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const initialHash = window.location.hash;

    if (!initialHash) {
      return;
    }

    let current = true;

    // A direct fragment can scroll before font metrics settle, particularly on reload.
    void document.fonts.ready.then(() => {
      if (!current || window.location.hash !== initialHash) {
        return;
      }

      const target = document.getElementById(initialHash.slice(1));

      const top = target?.getBoundingClientRect().top;

      const headerBottom = header.current?.getBoundingClientRect().top ?? 16;

      if (top !== undefined && (top < headerBottom + 58 || top >= innerHeight)) {
        target?.scrollIntoView({ behavior: "instant" });
      }
    });

    return () => {
      current = false;
    };
  }, []);

  const handleMenuKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (phase === "open") {
        close();
      }

      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const controls = Array.from(
      header.current?.querySelectorAll<HTMLElement>(
        ".site-mobile-controls button, .site-mobile-menu a",
      ) ?? [],
    ).filter((element) => element.tabIndex >= 0);

    if (!controls.length) {
      return;
    }

    event.preventDefault();
    const index = controls.findIndex((element) => element === document.activeElement);

    const next =
      index < 0
        ? event.shiftKey
          ? controls.length - 1
          : 0
        : (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;

    controls[next]?.focus();
  });

  useEffect(() => {
    if (!active) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      handleMenuKey(event);
    }

    document.addEventListener("keydown", onKey);

    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  useLayoutEffect(() => {
    const root = header.current;

    if (!active || !root?.parentElement) {
      return;
    }

    const background = Array.from(root.parentElement.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child !== root && !child.inert,
    );

    background.forEach((element) => {
      element.inert = true;
    });
    document.documentElement.classList.add("home-navigation-active");

    function measure() {
      const bounds = trigger.current?.getBoundingClientRect();

      if (!bounds) {
        return;
      }

      const x = bounds.left + bounds.width / 2;

      const y = bounds.top + bounds.height / 2;

      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 2;

      surface.current?.style.setProperty("--menu-x", `${x}px`);
      surface.current?.style.setProperty("--menu-y", `${y}px`);
      surface.current?.style.setProperty("--menu-radius", `${radius}px`);
    }

    measure();
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
      background.forEach((element) => {
        element.inert = false;
      });
      document.documentElement.classList.remove("home-navigation-active");
    };
  }, [active]);

  useLayoutEffect(() => {
    if (phase === "open") {
      menu.current?.querySelector("a")?.focus({ preventScroll: true });

      return;
    }

    if (phase !== "closed") {
      return;
    }

    const hash = pendingHash.current;

    pendingHash.current = null;
    if (hash) {
      const destination = document.getElementById(hash.slice(1));

      if (window.location.hash !== hash) {
        window.history.pushState(null, "", hash);
      }

      destination?.scrollIntoView();

      destination?.focus({ preventScroll: true });
    } else if (restoreFocus.current) {
      trigger.current?.focus({ preventScroll: true });
    }

    restoreFocus.current = false;
  }, [phase]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const mobile = matchMedia(mobileNavigation);

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");

    function settle() {
      if (!mobile.matches || (phase === "closing" && reduced.matches)) {
        setPhase("closed");
      }
    }

    mobile.addEventListener("change", settle);
    reduced.addEventListener("change", settle);
    const timeout =
      phase === "closing" ? window.setTimeout(() => setPhase("closed"), 560) : undefined;

    return () => {
      window.clearTimeout(timeout);
      mobile.removeEventListener("change", settle);
      reduced.removeEventListener("change", settle);
    };
  }, [active, phase]);

  function followLink(event: MouseEvent<HTMLAnchorElement>, hash: string) {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
      return;
    }

    event.preventDefault();
    close(hash);
  }

  return (
    <header className="site-header" ref={header} data-menu={phase}>
      <a className="site-skip-link" href="#main-content" tabIndex={active ? -1 : undefined}>
        Skip to content
      </a>
      <div className="site-nav">
        <Link
          href="/#top"
          aria-label="Freemancodz home"
          className="site-wordmark"
          tabIndex={active ? -1 : undefined}
        >
          <Image
            src="/images/logo.svg"
            width={168}
            height={29}
            alt="Freemancodz"
            className="site-logo-light"
          />
          <Image
            src="/images/logo-dark.svg"
            width={168}
            height={29}
            alt=""
            aria-hidden="true"
            className="site-logo-dark"
          />
        </Link>
        <nav className="site-section-links" aria-label="Main navigation">
          {links.map(({ hash, text }) => (
            <a key={hash} href={`/${hash}`}>
              {text}
            </a>
          ))}
          <ThemeToggle />
        </nav>
        <div className="site-mobile-controls">
          <ThemeToggle />
          <button
            className="site-menu-trigger"
            type="button"
            ref={trigger}
            aria-label={phase === "open" ? "Close navigation" : "Open navigation"}
            aria-expanded={phase === "open"}
            aria-controls="site-mobile-menu"
            onClick={() => {
              if (phase === "open") {
                close();
              } else {
                pendingHash.current = null;
                restoreFocus.current = false;
                setPhase("open");
              }
            }}
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div ref={surface} className="site-menu-surface" aria-hidden="true" />
      <nav
        className="site-mobile-menu"
        id="site-mobile-menu"
        aria-label="Main navigation"
        aria-hidden={phase !== "open"}
        ref={menu}
      >
        {links.map(({ hash, text }, index) => (
          <a
            key={hash}
            href={`/${hash}`}
            tabIndex={phase === "open" ? 0 : -1}
            style={
              {
                "--menu-enter-delay": `${180 + index * 75}ms`,
                "--menu-exit-delay": `${(2 - index) * 35}ms`,
              } as React.CSSProperties
            }
            onClick={(event) => followLink(event, hash)}
          >
            {text}
            <ArrowUpRight size={24} aria-hidden="true" />
          </a>
        ))}
      </nav>
      <noscript>
        <nav className="site-menu-fallback" aria-label="Main navigation">
          {links.map(({ hash, text }) => (
            <a key={hash} href={`/${hash}`}>
              {text}
            </a>
          ))}
        </nav>
      </noscript>
    </header>
  );
}
