import { Sparkles } from "lucide-react";
import type { AuditPageData } from "@/contracts/audit-page.contract";
import { Container } from "@/shared/components/layout/Container";
import { AuditAction } from "./AuditAction";
export function AuditFinalCta({ cta }: { cta: AuditPageData["finalCta"] }) { return <Container className="pb-20 md:pb-28"><section className="rounded-lg bg-gradient-to-br from-indigo-700 to-indigo-500 px-7 py-10 text-white md:px-12 md:py-14"><Sparkles className="text-indigo-200"/><h2 className="mt-6 max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl">{cta.headline}</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-indigo-100">{cta.copy}</p><div className="mt-8"><AuditAction action={cta.action} className="border-white bg-white text-ink"/></div><p className="mt-4 font-mono text-xs text-indigo-100">{cta.microcopy}</p></section></Container>; }
