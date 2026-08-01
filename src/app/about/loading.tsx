import { Container } from "@/shared/components/layout/Container";

export default function AboutLoading() {
  return (
    <Container className="py-20 md:py-[120px]">
      <main
        className="animate-pulse space-y-10"
        aria-busy="true"
        aria-label="Loading about content"
      >
        <div className="h-16 max-w-3xl rounded bg-line" />
        <div className="h-32 rounded bg-line" />
      </main>
    </Container>
  );
}
