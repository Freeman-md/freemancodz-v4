BEGIN;

CREATE TABLE public.workflow_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL,
  workflow_version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  state JSONB NOT NULL,
  origin_channel TEXT NOT NULL,
  origin_page TEXT,
  origin_entry TEXT,
  started_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ(6),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT workflow_instances_pkey PRIMARY KEY (id),
  CONSTRAINT workflow_instances_workflow_id_check CHECK (
    NULLIF(BTRIM(workflow_id), '') IS NOT NULL
  ),
  CONSTRAINT workflow_instances_workflow_version_check CHECK (workflow_version > 0),
  CONSTRAINT workflow_instances_status_check CHECK (
    status IN ('active', 'completed', 'cancelled')
  ),
  CONSTRAINT workflow_instances_state_check CHECK (jsonb_typeof(state) = 'object'),
  CONSTRAINT workflow_instances_origin_channel_check CHECK (
    NULLIF(BTRIM(origin_channel), '') IS NOT NULL
  ),
  CONSTRAINT workflow_instances_completed_at_check CHECK (
    (status = 'completed' AND completed_at IS NOT NULL)
    OR (status IN ('active', 'cancelled') AND completed_at IS NULL)
  )
);

ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.workflow_instances FROM PUBLIC, anon, authenticated;

COMMIT;
