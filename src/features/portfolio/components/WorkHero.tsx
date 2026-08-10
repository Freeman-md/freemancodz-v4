import Image from "next/image";

export function WorkHero() {
  return (
    <section className="relative hidden lg:block overflow-hidden border-b border-line bg-[#fbf9f9]">
      <div className="relative mx-auto sm:min-h-[calc(100svh-4rem)] max-w-[1440px] px-5 pb-10 pt-10 sm:px-8 sm:pt-20 lg:min-h-[780px] lg:px-20 lg:pb-32 lg:pt-24">
        <div className="relative z-10 max-w-5xl lg:w-[75%]">
          <span aria-hidden="true" className="block h-1 w-16 rounded-full bg-signal-600" />
          <h1 className="mt-7 text-[clamp(2.9rem,11.5vw,5rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-slate-950 sm:mt-10 sm:text-7xl lg:text-[clamp(4.75rem,6.7vw,6rem)]">
            <span className="block">Products and</span>
            <span className="block">workflows built</span>
            <span className="block">
              around real <span className="block sm:inline">problems.</span>
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-sm leading-6 text-slate-700 sm:text-xl sm:leading-9 lg:text-2xl">
            Relevant work across customer-facing products, operational systems and practical AI.
          </p>

          <dl className="mt-16 hidden max-w-sm border-t border-line pt-8 text-sm leading-6 text-slate-700 lg:grid lg:gap-7">
            <div>
              <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Focus
              </dt>
              <dd className="mt-1 font-display text-lg text-slate-900">Product · Systems · AI</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Approach
              </dt>
              <dd className="mt-1 max-w-xs font-display text-lg text-slate-900">
                User value, operational impact, technical rigor.
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative mt-12 h-[25rem] sm:h-[34rem] lg:absolute lg:-bottom-10 lg:left-[44%] lg:right-[-6%] lg:mt-0 lg:h-[23rem] xl:h-[25rem]">
          <div className="absolute inset-0 translate-x-3 translate-y-4 rounded-[2rem] bg-signal-100/70 sm:translate-x-5 sm:translate-y-6" />
          <div className="relative h-full overflow-hidden rounded-tl-[2rem] border border-signal-100 bg-white shadow-[0_32px_80px_-40px_rgba(55,48,163,0.5)] lg:rotate-[-2deg]">
            <Image
              alt="WithRadius homepage showing its international payment experience"
              className="object-cover object-top"
              fill
              priority
              sizes="(min-width: 1024px) 64vw, 100vw"
              src="/images/work/withradius-hero.jpg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
