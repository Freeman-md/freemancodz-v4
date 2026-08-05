import type { HomeProofOfWork } from "@/features/portfolio/models/home-page";
import { Container } from "@/shared/components/layout/Container";
import { SectionHeader } from "@/shared/components/ui/SectionHeader";
import { ProofOfWorkCard } from "./ProofOfWorkCard";

export function ProofOfWorkSection({ proof }: { proof: HomeProofOfWork }) {
  const [dominant, ...secondary] = proof.items;

  return (
    <section className="border-y border-line bg-surface">
      <Container className="py-20 md:py-[120px]">
        <SectionHeader title={proof.title} copy={proof.copy} />
        {dominant ? <ProofOfWorkCard {...dominant} dominant /> : null}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {secondary.map((item) => (
            <ProofOfWorkCard key={item.project.key} {...item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
