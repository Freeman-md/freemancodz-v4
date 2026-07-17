import { Container } from "@/components/Container";

export default function AboutLoading() {
  return (
    <Container className="py-20 md:py-[120px]" aria-busy="true" aria-label="Loading about content">
      <div className="animate-pulse space-y-10">
        <div className="h-16 max-w-3xl rounded bg-line" />
        <div className="h-32 rounded bg-line" />
      </div>
    </Container>
  );
}
