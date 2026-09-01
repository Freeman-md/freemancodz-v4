import { Container } from "@/shared/components/layout/Container";
import Image from "next/image";
import { PortfolioIcon } from "@/features/portfolio/components/PortfolioIcon";
import type { AboutPresentationData } from "@/features/portfolio/models/portfolio-presentation";

function PortraitSignal({ image, name }: { image: string | null; name: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex size-52 items-center justify-center rounded-full border border-signal-300 bg-signal-50/50 p-3 motion-safe:animate-signal-glow sm:size-64 lg:size-80 xl:size-[22rem]">
        <div className="relative size-full overflow-hidden rounded-full border-4 border-white bg-surface shadow-[0_14px_34px_-22px_rgba(55,48,163,0.8)]">
          {image ? (
            <Image
              alt={name}
              className="size-full object-cover grayscale transition duration-500 hover:grayscale-0"
              src={image}
              fill
              sizes="(min-width: 1280px) 22rem, (min-width: 1024px) 20rem, 16rem"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AboutHero({ hero, profile }: Pick<AboutPresentationData, "hero" | "profile">) {
  const paragraphs = hero.copy.split("\n\n");

  return (
    <Container>
      <section className="py-16 sm:py-20 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)] lg:gap-16">
          <div className="max-w-2xl lg:max-w-xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-signal-800">
              {hero.eyebrow}
            </p>
            <h1 className="mt-8 text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-ink sm:text-6xl lg:text-6xl">
              {hero.title}
            </h1>
            <span aria-hidden="true" className="mt-8 block h-1 w-14 rounded-full bg-signal-500" />
            <div className="mt-9 max-w-xl space-y-5 text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="flex justify-center py-2 lg:py-0">
            <PortraitSignal image={profile.coverImage} name={profile.name} />
          </div>
        </div>

        <div className="mt-14 grid overflow-hidden rounded-3xl border border-line bg-white shadow-soft grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {profile.principles.map(({ iconName, label }, index) => (
            <article
              className={`flex items-center gap-4 p-5 sm:p-6 ${
                index < profile.principles.length - 1
                  ? "border-b border-line lg:border-b-0 lg:border-r"
                  : ""
              } ${index === 1 ? "sm:border-b sm:border-r lg:border-r" : ""}`}
              key={label}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-signal-100 bg-signal-50/50 text-signal-700">
                <PortfolioIcon aria-hidden="true" className="size-5 stroke-[1.7]" name={iconName} />
              </div>
              <p className="text-sm font-semibold leading-5 tracking-[-0.02em] text-ink">{label}</p>
            </article>
          ))}
        </div>
      </section>
    </Container>
  );
}
