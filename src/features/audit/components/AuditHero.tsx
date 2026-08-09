import { Clock3 } from "lucide-react";
import { Container } from "@/shared/components/layout/Container";
import { AuditButton } from "./AuditButton";

export function AuditHero() {
  return (
    <Container>
      <section className="flex flex-col items-center justify-start pb-16 pt-24 text-center sm:pb-20 sm:pt-28">
        <p className="rounded-full border border-[#cfcfcf] px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#333]">
          Free customer journey &amp; workflow audit
        </p>
        <h1 className="mt-8 max-w-[760px] text-5xl font-semibold leading-[0.92] tracking-[-0.065em] text-black sm:text-6xl lg:text-[72px]">
          Find where customers get stuck or work slows down.
        </h1>
        <p className="mt-7 max-w-[590px] text-base leading-7 text-[#3f3f46] sm:text-[17px]">
          A focused review of one important customer journey or operational workflow.
          Personally reviewed by Freeman, delivered within 48 hours.
        </p>
        <AuditButton />
        <p className="mt-4 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.02em] text-[#737373]">
          <Clock3 size={12} strokeWidth={1.5} />
          Takes 2 - 3 minutes
        </p>
      </section>
    </Container>
  );
}
