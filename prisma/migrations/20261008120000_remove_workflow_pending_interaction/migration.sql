-- Deploy the application without pending_interaction first and retire old instances
-- before applying this cleanup. Workflow state and revision remain unchanged.
ALTER TABLE "workflow_instances"
  DROP CONSTRAINT "workflow_instances_pending_interaction_object",
  DROP COLUMN "pending_interaction";
