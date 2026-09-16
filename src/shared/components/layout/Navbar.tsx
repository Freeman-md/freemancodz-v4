import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Navbar() {
  return (
    <header className="site-header">
      <a className="site-skip-link" href="#main-content">
        Skip to content
      </a>
      <nav className="site-nav" aria-label="Main navigation">
        <Link href="/#top" aria-label="Freemancodz home" className="site-wordmark">
          <Image src="/images/logo.svg" width={168} height={29} alt="Freemancodz" priority />
        </Link>
        <div className="site-section-links">
          <Link href="/#work">Work</Link>
          <Link href="/#about">Freeman</Link>
          <Link href="/#audit">
            Let’s talk
            <ArrowUpRight aria-hidden="true" size={14} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
