import { contactService } from "@/modules/composition";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";

export default async function AdminMessagesPage() {
  const requests = await contactService.listRequests();

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
      <p className="mt-2 text-muted">Submitted project, collaboration and general enquiries.</p>

      {requests.length === 0 ? (
        <p className="mt-8 rounded-xl border border-line bg-white p-6 text-sm text-muted">
          No messages have been submitted yet.
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
                    {request.businessName ? (
                      <p className="mt-1 text-sm text-muted">{request.businessName}</p>
                    ) : null}
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
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {request.message}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
