import { externalLinks } from "@/shared/config/links";
import { buttonVariants } from "@/shared/components/ui/Button";

export function CTASection({ title, copy }: { title?: string; copy: string }) {
  return (
    <section className="rounded-lg bg-black px-8 py-10 text-white md:px-12 md:py-12">
      <div className="flex flex-col gap-8">
        <div className="max-w-3xl">
          {title ? (
            <p className="mb-3 font-mono text-[12px] tracking-[0.02em] text-white/65">{title}</p>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
            {copy}
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/work"
            className={buttonVariants({
              className: "font-mono text-[12px] tracking-[0.02em]",
              size: "lg",
              variant: "signal",
            })}
          >
            View My Work
          </a>
          <a
            href={externalLinks.linkedin}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              className:
                "border-white bg-transparent font-mono text-[12px] tracking-[0.02em] text-white hover:border-white hover:bg-white/10",
              size: "lg",
              variant: "outline",
            })}
          >
            Connect on LinkedIn
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
