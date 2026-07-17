import { Container } from "@/components/Container";

export default function WorkLoading() {
  return (
    <Container className="py-20 md:py-[120px]" aria-busy="true" aria-label="Loading work">
      <div className="animate-pulse space-y-12">
        <div className="h-16 max-w-3xl rounded bg-line" />
        <div className="h-96 rounded bg-line" />
      </div>
    </Container>
  );
}
