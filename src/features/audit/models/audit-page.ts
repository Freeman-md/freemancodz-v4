export type AuditAction = { label: string; prompt: string };
export type AuditPage = {
  hero: { eyebrow: string; headline: string; copy: string; audience: string; deliverables: string[]; reassurance: string; action: AuditAction; example: { label: string; steps: Array<{ label: string; emphasis: boolean }>; frictionLabel: string; frictionCopy: string; recommendationLabel: string; recommendationCopy: string } };
  problemSignals: { eyebrow: string; headline: string; copy: string; items: Array<{ key: string; title: string; copy: string }>; closing: string };
  deliverable: { eyebrow: string; headline: string; copy: string; previewLabel: string; items: Array<{ key: string; title: string; copy: string }>; boundary: string; process: Array<{ title: string; copy: string }>; reassurance: string; action: AuditAction };
  proof: { eyebrow: string; headline: string; copy: string; items: Array<{ key: string; title: string; outcome: string; label: string }> };
  finalCta: { headline: string; copy: string; microcopy: string; action: AuditAction };
};
