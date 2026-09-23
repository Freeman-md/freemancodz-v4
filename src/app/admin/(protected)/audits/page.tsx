import { auditRequestService } from "@/modules/composition";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";

export default async function AdminAuditsPage() {
  const requests = await auditRequestService.listRequests();

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">Audit requests</h1>
      <p className="mt-2 text-muted">Submitted requests for personal review, newest first.</p>

      {requests.length === 0 ? (
        <p className="mt-8 rounded-xl border border-line bg-white p-6 text-sm text-muted">
          No audit requests have been submitted yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-5">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{request.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted">{request.email}</p>
                  </div>
                  <time
                    className="font-mono text-xs text-muted"
                    dateTime={request.createdAt.toISOString()}
                  >
                    {request.createdAt.toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Europe/London",
                    })}
                  </time>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 text-sm leading-6">
                {request.businessName || request.websiteUrl ? (
                  <AuditDetail label="Business">
                    {[request.businessName, request.websiteUrl].filter(Boolean).join(" · ")}
                  </AuditDetail>
                ) : null}
                <AuditDetail label="Focus">{request.focus}</AuditDetail>
                <AuditDetail label="Current process">{request.currentProcess}</AuditDetail>
                <AuditDetail label="Friction">{request.friction}</AuditDetail>
                <AuditDetail label="Desired outcome">{request.desiredOutcome}</AuditDetail>
                {request.additionalContext ? (
                  <AuditDetail label="Additional context">{request.additionalContext}</AuditDetail>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function AuditDetail({ children, label }: { children: string; label: string }) {
  return (
    <div>
      <h2 className="font-mono text-xs font-semibold tracking-wide text-signal-700 uppercase">
        {label}
      </h2>
      <p className="mt-1 whitespace-pre-wrap text-slate-800">{children}</p>
    </div>
  );
}
