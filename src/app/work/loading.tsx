import { Container } from "@/components/layout/Container";

export default function WorkLoading() {
  return (
    <Container className="py-20 md:py-[120px]">
      <main className="animate-pulse space-y-12" aria-busy="true" aria-label="Loading work">
        <div className="h-16 max-w-3xl rounded bg-line" />
        <div className="h-96 rounded bg-line" />
      </main>
    </Container>
  );
}
