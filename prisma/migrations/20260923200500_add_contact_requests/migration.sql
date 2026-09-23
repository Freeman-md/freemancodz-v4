BEGIN;

CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  business_name TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT contact_requests_pkey PRIMARY KEY (id),
  CONSTRAINT contact_requests_workflow_instance_id_key UNIQUE (workflow_instance_id),
  CONSTRAINT contact_requests_workflow_instance_id_fkey FOREIGN KEY (workflow_instance_id)
    REFERENCES public.workflow_instances(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT contact_requests_required_text_check CHECK (
    NULLIF(BTRIM(name), '') IS NOT NULL
    AND NULLIF(BTRIM(email), '') IS NOT NULL
    AND NULLIF(BTRIM(message), '') IS NOT NULL
  )
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.contact_requests FROM PUBLIC, anon, authenticated;

COMMIT;
