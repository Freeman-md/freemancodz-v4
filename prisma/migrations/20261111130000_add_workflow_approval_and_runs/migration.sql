BEGIN;

CREATE TABLE "workflow_reviews" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "instance_id" UUID NOT NULL REFERENCES "workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "revision" INTEGER NOT NULL CHECK ("revision" >= 0),
  "version" INTEGER NOT NULL CHECK ("version" > 0),
  "action_key" TEXT NOT NULL,
  "display" JSONB NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'invalidated', 'consumed')),
  CONSTRAINT "workflow_reviews_instance_id_revision_key" UNIQUE ("instance_id", "revision")
);

CREATE TABLE "workflow_runs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "review_id" UUID NOT NULL UNIQUE REFERENCES "workflow_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'queued' CHECK ("status" IN ('queued', 'running', 'finished', 'attention')),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE "workflow_steps" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "run_id" UUID NOT NULL REFERENCES "workflow_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "key" TEXT NOT NULL,
  "position" INTEGER NOT NULL CHECK ("position" >= 0),
  "label" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued' CHECK ("status" IN ('queued', 'running', 'retry', 'reconciling', 'succeeded', 'attention')),
  "attempts" INTEGER NOT NULL DEFAULT 0 CHECK ("attempts" BETWEEN 0 AND 3),
  "probes" INTEGER NOT NULL DEFAULT 0 CHECK ("probes" BETWEEN 0 AND 3),
  "next_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "claim_token" UUID,
  "claim_expires" TIMESTAMPTZ(6),
  "first_effect" TIMESTAMPTZ(6),
  "checkpoint" JSONB,
  "outcome" JSONB,
  "reason" TEXT,
  CHECK (("claim_token" IS NULL) = ("claim_expires" IS NULL)),
  CONSTRAINT "workflow_steps_run_id_key_key" UNIQUE ("run_id", "key"),
  CONSTRAINT "workflow_steps_run_id_position_key" UNIQUE ("run_id", "position")
);

CREATE INDEX "workflow_steps_status_next_at_idx" ON "workflow_steps"("status", "next_at");

ALTER TABLE "workflow_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_steps" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "workflow_reviews", "workflow_runs", "workflow_steps" FROM PUBLIC, anon, authenticated, service_role;

ALTER TABLE "meetings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "meetings" FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
