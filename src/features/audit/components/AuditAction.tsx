"use client";
import { ArrowRight } from "lucide-react";
import type { AuditPageData } from "@/contracts/audit-page.contract";
import { AssistantTriggerButton } from "@/features/assistant/components/AssistantTriggerButton";
export function AuditAction({ action, className }: { action: AuditPageData["hero"]["action"]; className?: string }) { return <AssistantTriggerButton variant="accent" className={className} detail={{ message: action.prompt }}>{action.label}<ArrowRight size={15}/></AssistantTriggerButton>; }
