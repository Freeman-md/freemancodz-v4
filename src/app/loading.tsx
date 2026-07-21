import { Container } from "@/components/layout/Container";

export default function Loading() {
  return (
    <Container className="py-20 md:py-[120px]">
      <main className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading portfolio content">
        <div className="h-4 w-32 rounded bg-line" />
        <div className="h-16 max-w-3xl rounded bg-line" />
        <div className="h-8 max-w-xl rounded bg-line" />
      </main>
    </Container>
  );
}
