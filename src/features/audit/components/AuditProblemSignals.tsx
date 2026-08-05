import { Clock3, MousePointerClick, Repeat2, TriangleAlert } from "lucide-react";
import type { AuditPageData } from "@/contracts/audit-page.contract";
import { Container } from "@/shared/components/layout/Container";
const icons = [MousePointerClick, TriangleAlert, Repeat2, Clock3];

export function AuditProblemSignals({ signals }: { signals: AuditPageData["problemSignals"] }) { return <Container className="py-20 md:py-28"><p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">{signals.eyebrow}</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-ink md:text-5xl">{signals.headline}</h2><p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{signals.copy}</p><div className="relative mt-10 grid gap-4 md:grid-cols-4 md:before:absolute md:before:left-10 md:before:right-10 md:before:top-10 md:before:h-px md:before:bg-accent/30">{signals.items.map((item, index) => { const Icon = icons[index];

 return <article key={item.key} className="relative rounded-sm border border-line bg-white p-6"><Icon className="mb-8 text-accent" size={20}/><h3 className="text-lg font-medium text-ink">{item.title}</h3><p className="mt-3 text-sm leading-6 text-muted">{item.copy}</p></article>; })}</div><p className="mt-6 font-mono text-sm text-accent">{signals.closing}</p></Container>; }
