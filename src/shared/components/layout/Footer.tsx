import { LinkButton as Button } from "@/shared/components/ui/LinkButton";
import { Container } from "@/shared/components/layout/Container";
import { externalLinks } from "@/shared/config/links";
import Link from "next/link";

export function Footer({ cvUrl }: { cvUrl?: string }) {
  return (
    <footer className="border-t border-line bg-white">
      <Container className="flex flex-col gap-5 py-12 md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-[11px] font-semibold text-muted">
          © 2026 Freeman Madudili. Built with technical precision.
        </p>
        <div className="flex flex-wrap items-center gap-4 font-mono text-[12px] text-muted">
          <Link href="/work" className="transition hover:text-accent">
            View My Work
          </Link>
          <a
            href={externalLinks.linkedin}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-accent"
          >
            LinkedIn
          </a>
          <a
            href={externalLinks.github}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-accent"
          >
            GitHub
          </a>
          {cvUrl ? (
            <a
              href={cvUrl}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-accent"
            >
              CV
            </a>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}
