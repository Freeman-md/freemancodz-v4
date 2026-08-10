"use client";

import { Container } from "@/shared/components/layout/Container";
import { Button } from "@/shared/components/ui/Button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <Container className="py-20 md:py-[120px]">
      <main role="alert" className="max-w-xl">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink">
          Something went wrong.
        </h1>
        <p className="mt-4 text-muted">The portfolio content could not be displayed.</p>
        <Button
          type="button"
          onClick={reset}
          className="mt-6 font-mono text-[12px]"
          size="sm"
          variant="link"
        >
          Try again
        </Button>
      </main>
    </Container>
  );
}
