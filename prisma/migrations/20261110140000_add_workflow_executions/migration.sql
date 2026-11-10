CREATE TABLE public.workflow_executions (
  id uuid PRIMARY KEY,
  workflow_instance_id uuid NOT NULL REFERENCES public.workflow_instances(id) ON DELETE RESTRICT,
  reviewed_revision integer NOT NULL CHECK (reviewed_revision >= 0),
  action_key text NOT NULL,
  approved_input jsonb NOT NULL CHECK (jsonb_typeof(approved_input) = 'object'),
  step text NOT NULL CHECK (step IN ('calendar', 'owner_notice', 'done', 'needs_review', 'failed')),
  checkpoint jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(checkpoint) = 'object'),
  attempt integer NOT NULL DEFAULT 0 CHECK (attempt BETWEEN 0 AND 3),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  lease_expires_at timestamptz,
  step_started_at timestamptz,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workflow_instance_id, reviewed_revision),
  CHECK ((lease_token IS NULL) = (lease_expires_at IS NULL))
);

CREATE INDEX workflow_executions_step_next_attempt_at_idx
  ON public.workflow_executions (step, next_attempt_at);

ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.workflow_executions FROM PUBLIC, anon, authenticated, service_role;

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.meetings FROM PUBLIC, anon, authenticated, service_role;
