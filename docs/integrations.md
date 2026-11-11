# Integrations

| Service | Role | Verification |
| --- | --- | --- |
| Supabase PostgreSQL and pgvector | Published portfolio records, search index, workflow state, reviews, runs, and step claims | Run database suites on a disposable database. |
| OpenAI | Conversation, tool selection, and query and index embeddings | Smoke-test a grounded portfolio question on staging and open its sources. |
| Google Calendar | Availability lookup and event creation from an approved booking | Rehearse scheduling and reconciliation with controlled providers and PostgreSQL. |
| Resend | Owner notification after the booking record is saved | The local booking saved a provider receipt and Freeman confirmed delivery to the Labs inbox. |
| Vercel | Builds public pages and hosts the assistant and workflow routes | Match the staging Preview deployment to the pushed commit before smoke testing. |

Use [the environment variable example](../.env.example) for configuration names. Set the intended owner recipient through `ADMIN_EMAIL` and the verified sender through `RESEND_FROM_EMAIL`. The notification step records Resend’s acceptance receipt. Check that receipt in Resend when investigating delivery to the destination mailbox. [Resend delivery status guide](https://resend.com/guides/email/users-never-got-login-code)

The `staging` branch triggers a Vercel Preview deployment. Use the protected Preview for a portfolio search smoke test and use disposable PostgreSQL for workflow rehearsals. See [Workflows](workflow-foundation.md#release-and-scheduling) for runner setup and [RAG](rag.md#refresh-the-index) for index publishing.
