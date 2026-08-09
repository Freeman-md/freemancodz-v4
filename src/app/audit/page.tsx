import type { Metadata } from "next";
import { AuditPage } from "@/features/audit/components/AuditPage";

export const metadata: Metadata = { title: "Free Customer Journey & Workflow Audit | Freeman Madudili", description: "Identify where customers are getting stuck or repetitive work is slowing your business down. Start with one journey or workflow and get a focused visual diagnosis." };

export default function Audit() {
  return <AuditPage />;
}
