import { externalLinks } from "@/data/navigation";
import { Button } from "./Button";

export function CTASection({
  title,
  copy,
}: {
  title?: string;
  copy: string;
}) {
  return (
    <section className="border-t border-line pt-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          {title ? (
            <p className="mb-3 font-mono text-[12px] tracking-[0.02em] text-muted">
              {title}
            </p>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-ink md:text-5xl">
            {copy}
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/work">View My Work</Button>
          <Button
            href={externalLinks.linkedin}
            variant="ghost"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </Button>
        </div>
      </div>
    </section>
  );
}
