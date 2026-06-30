import { Button } from "@/components/Button";
import { externalLinks } from "@/data/navigation";

export function Footer({ cvUrl }: { cvUrl?: string }) {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="font-mono text-[11px] font-semibold text-muted">
          © 2026 Freeman Madudili. Built with technical precision.
        </p>
        <div className="flex flex-wrap items-center gap-4 font-mono text-[12px] text-muted">
          <Button
            href="/work"
            className="rounded-[3px] border-[#4f46e5] bg-[#4f46e5] px-4 py-2 text-white hover:border-[#6366f1] hover:bg-[#6366f1]"
          >
            View My Work
          </Button>
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
      </div>
    </footer>
  );
}
