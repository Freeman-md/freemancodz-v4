ALTER TABLE public.workflow_instances
  ADD COLUMN pending_interaction JSONB,
  ADD COLUMN revision INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT workflow_instances_revision_nonnegative CHECK (revision >= 0),
  ADD CONSTRAINT workflow_instances_pending_interaction_object CHECK (
    pending_interaction IS NULL OR jsonb_typeof(pending_interaction) = 'object'
  );

-- Existing RLS, grants and policies remain unchanged.
