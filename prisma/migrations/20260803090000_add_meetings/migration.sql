CREATE TABLE "meetings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "google_event_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "starts_at" TIMESTAMPTZ(6) NOT NULL,
  "ends_at" TIMESTAMPTZ(6) NOT NULL,
  "status" TEXT NOT NULL,
  "google_event_url" TEXT,
  "raw_provider_payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meetings_google_event_id_key" ON "meetings"("google_event_id");
CREATE INDEX "meetings_starts_at_idx" ON "meetings"("starts_at");
