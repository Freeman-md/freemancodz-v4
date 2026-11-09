BEGIN;

DROP TABLE public.audit_requests;
DELETE FROM public.workflow_instances WHERE workflow_id = 'audit';

COMMIT;
