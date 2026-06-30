import Link from "next/link";
import { externalLinks } from "@/data/navigation";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="font-mono text-[11px] text-muted">
          © 2026 Freeman Madudili. Built with technical precision.
        </p>
        <div className="flex flex-wrap gap-6 text-sm text-muted">
          <Link href="/work" className="transition hover:text-accent">
            View Work
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
          {externalLinks.cv ? (
            <a
              href={externalLinks.cv}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-accent"
            >
              CV
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
