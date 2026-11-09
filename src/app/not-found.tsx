import Link from "next/link";
import { Container } from "./_components/layout/Container";

export default function NotFound() {
  return (
    <Container className="py-20 md:py-[120px]">
      <main>
        <h1 className="text-3xl font-semibold text-ink">Page not found</h1>
        <p className="mt-4 text-muted">You can find the published case studies in Work.</p>
        <Link className="mt-6 inline-block underline" href="/work">
          Back to Work
        </Link>
      </main>
    </Container>
  );
}
