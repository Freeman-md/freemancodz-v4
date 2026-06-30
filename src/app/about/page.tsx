import { CTASection } from "@/components/CTASection";
import { Container } from "@/components/Container";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { profile } from "@/data/profile";
import { siteAssetLinks } from "@/lib/links";

export default function AboutPage() {
  return (
    <>
      <Container className="space-y-20 py-20 md:space-y-[120px] md:py-[120px]">
        <section className="max-w-3xl">
          <h1 className="text-[38px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink md:text-[64px] md:leading-[1.1]">
            { profile.aboutHeadline }
          </h1>
          <div className="mt-8 space-y-6 text-lg leading-8 text-muted">
            {profile.aboutIntro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-ink md:text-5xl">
            Engineering Philosophy
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {profile.aboutPrinciples.map((principle) => (
              <article
                key={principle.title}
                className="rounded-sm border border-line bg-white p-8 transition hover:border-neutral-300 hover:shadow-soft"
              >
                <h3 className="text-2xl font-medium tracking-[-0.03em] text-ink">
                  {principle.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {principle.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-ink md:text-5xl">
            How I Work
          </h2>
          <div className="mt-12 border-l border-line pl-6 md:border-l-0 md:border-t md:pl-0 md:pt-12">
            <div className="grid gap-8 md:grid-cols-6">
              {profile.workProcess.map((step, index) => (
                <article key={step} className="relative">
                  <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-black ring-4 ring-[#fbf9f9] md:-top-[55px] md:left-0 md:right-0 md:mx-auto" />
                  <p className="font-mono text-[12px] text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-xl font-medium tracking-[-0.03em] text-ink">
                    {step.replace(/\.$/, "")}
                  </h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-ink md:text-5xl">
            Current Research
          </h2>
          <div className="mt-8 rounded-sm border border-line bg-[#efeded] p-8 md:p-12">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="rounded-sm border border-line bg-white px-3 py-1 font-mono text-[12px] text-muted">
                MSc Research
              </span>
              <span className="h-1 w-1 rounded-full bg-black" />
              <span className="font-mono text-[12px] text-ink">In Progress</span>
            </div>
            <h3 className="text-[38px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink md:text-[64px] md:leading-[1.1]">
              Self-healing backend operations agents.
            </h3>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
              {profile.education.research}
            </p>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
              {profile.education.support}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-ink md:text-5xl">
            Outside Engineering
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {profile.outsideEngineering.map((item) => (
              <article key={item.title}>
                <ImagePlaceholder
                  label={item.title}
                  src={siteAssetLinks.outsideImages[item.title as keyof typeof siteAssetLinks.outsideImages]}
                  className="h-64"
                />
                <h3 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <CTASection copy="Want to see how this thinking shows up in my work?" />
      </Container>
    </>
  );
}
