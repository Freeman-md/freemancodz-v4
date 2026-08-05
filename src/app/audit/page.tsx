import type { Metadata } from "next";
import { connection } from "next/server";
import { AuditPage } from "@/features/audit/components/AuditPage";
import { AuditPageDataSchema } from "@/contracts/audit-page.contract";
import { portfolioService } from "@/server/composition-root";

export const metadata: Metadata = { title: "Free Customer Journey & Workflow Audit | Freeman Madudili", description: "Identify where customers are getting stuck or repetitive work is slowing your business down. Start with one journey or workflow and get a focused visual diagnosis." };

export default async function Audit() {
  await connection();

  const data = AuditPageDataSchema.parse(await portfolioService.getAuditPageData());

  return <AuditPage data={data} />;
}
