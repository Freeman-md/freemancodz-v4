BEGIN;

CREATE TABLE public.audit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL,
  focus TEXT NOT NULL,
  current_process TEXT NOT NULL,
  friction TEXT NOT NULL,
  desired_outcome TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT,
  website_url TEXT,
  additional_context TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT audit_requests_pkey PRIMARY KEY (id),
  CONSTRAINT audit_requests_workflow_instance_id_key UNIQUE (workflow_instance_id),
  CONSTRAINT audit_requests_workflow_instance_id_fkey FOREIGN KEY (workflow_instance_id)
    REFERENCES public.workflow_instances(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT audit_requests_required_text_check CHECK (
    NULLIF(BTRIM(focus), '') IS NOT NULL
    AND NULLIF(BTRIM(current_process), '') IS NOT NULL
    AND NULLIF(BTRIM(friction), '') IS NOT NULL
    AND NULLIF(BTRIM(desired_outcome), '') IS NOT NULL
    AND NULLIF(BTRIM(name), '') IS NOT NULL
    AND NULLIF(BTRIM(email), '') IS NOT NULL
  )
);

ALTER TABLE public.audit_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.audit_requests FROM PUBLIC, anon, authenticated;

COMMIT;
