BEGIN;

ALTER TABLE "workflow_instances" ADD COLUMN "visitor_key" TEXT;

CREATE UNIQUE INDEX "workflow_instances_active_visitor_workflow_key"
ON "workflow_instances" ("visitor_key", "workflow_id")
WHERE "status" = 'active' AND "visitor_key" IS NOT NULL;

COMMIT;
