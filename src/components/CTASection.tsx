import { externalLinks } from "@/data/navigation";

export function CTASection({
  title,
  copy,
}: {
  title?: string;
  copy: string;
}) {
  return (
    <section className="rounded-lg bg-black px-8 py-10 text-white md:px-12 md:py-12">
      <div className="flex flex-col gap-8">
        <div className="max-w-3xl">
          {title ? (
            <p className="mb-3 font-mono text-[12px] tracking-[0.02em] text-white/65">
              {title}
            </p>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
            {copy}
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/work"
            className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-[#4f46e5] bg-[#4f46e5] px-5 py-3 font-mono text-[12px] font-medium tracking-[0.02em] text-white transition hover:border-[#6366f1] hover:bg-[#6366f1]"
          >
            View My Work
          </a>
          <a
            href={externalLinks.linkedin}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-white bg-transparent px-5 py-3 font-mono text-[12px] font-medium tracking-[0.02em] text-white transition hover:bg-white/10"
          >
            Connect on LinkedIn
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
