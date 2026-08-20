BEGIN;

-- The old per-source queue is derived operational state. Remove its hooks defensively
-- before replacing it with the singleton portfolio rebuild state machine.
DO $$
DECLARE
  trigger_target RECORD;
BEGIN
  FOR trigger_target IN
    SELECT *
    FROM (VALUES
      ('content_blocks', 'content_blocks_search_index_job'),
      ('projects', 'projects_search_index_job'),
      ('services', 'services_search_index_job'),
      ('principles', 'principles_search_index_job'),
      ('experiences', 'experiences_search_index_job')
    ) AS legacy(table_name, trigger_name)
  LOOP
    IF to_regclass(format('public.%I', trigger_target.table_name)) IS NOT NULL THEN
      EXECUTE format(
        'DROP TRIGGER IF EXISTS %I ON public.%I',
        trigger_target.trigger_name,
        trigger_target.table_name
      );
    END IF;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.enqueue_search_index_job();
DROP TABLE public.search_index_jobs;

CREATE TABLE public.search_index_jobs (
  job_key TEXT NOT NULL DEFAULT 'portfolio',
  status TEXT NOT NULL DEFAULT 'pending',
  rerun_requested BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  requested_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMPTZ(6),
  processed_at TIMESTAMPTZ(6),
  last_error TEXT,
  CONSTRAINT search_index_jobs_pkey PRIMARY KEY (job_key),
  CONSTRAINT search_index_jobs_singleton_check CHECK (job_key = 'portfolio'),
  CONSTRAINT search_index_jobs_status_check CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  ),
  CONSTRAINT search_index_jobs_attempts_check CHECK (attempts >= 0)
);

ALTER TABLE public.search_index_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.search_index_jobs FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.enqueue_portfolio_search_index_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.search_index_jobs (
    job_key,
    status,
    rerun_requested,
    attempts,
    available_at,
    requested_at,
    claimed_at,
    processed_at,
    last_error
  )
  VALUES (
    'portfolio',
    'pending',
    false,
    0,
    statement_timestamp(),
    statement_timestamp(),
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (job_key) DO UPDATE SET
    status = CASE
      WHEN public.search_index_jobs.status = 'processing' THEN 'processing'
      ELSE 'pending'
    END,
    rerun_requested = public.search_index_jobs.status = 'processing',
    attempts = CASE
      WHEN public.search_index_jobs.status IN ('pending', 'processing')
        THEN public.search_index_jobs.attempts
      ELSE 0
    END,
    available_at = CASE
      WHEN public.search_index_jobs.status = 'processing'
        THEN public.search_index_jobs.available_at
      ELSE statement_timestamp()
    END,
    requested_at = statement_timestamp(),
    claimed_at = CASE
      WHEN public.search_index_jobs.status = 'processing'
        THEN public.search_index_jobs.claimed_at
      ELSE NULL
    END,
    processed_at = NULL,
    last_error = CASE
      WHEN public.search_index_jobs.status IN ('pending', 'processing')
        THEN public.search_index_jobs.last_error
      ELSE NULL
    END;

  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enqueue_portfolio_search_index_job()
FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

CREATE TRIGGER content_blocks_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.content_blocks
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

CREATE TRIGGER icon_blocks_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.icon_blocks
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

CREATE TRIGGER media_blocks_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.media_blocks
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

CREATE TRIGGER action_blocks_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.action_blocks
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

CREATE TRIGGER content_block_icon_blocks_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.content_block_icon_blocks
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

CREATE TRIGGER content_block_media_blocks_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.content_block_media_blocks
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

CREATE TRIGGER content_block_action_blocks_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.content_block_action_blocks
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

CREATE TRIGGER content_block_children_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.content_block_children
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

CREATE TRIGGER profile_icon_blocks_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.profile_icon_blocks
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

CREATE TRIGGER experiences_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.experiences
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

CREATE TRIGGER experience_icon_blocks_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.experience_icon_blocks
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

CREATE TRIGGER projects_search_index_job
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH STATEMENT EXECUTE FUNCTION public.enqueue_portfolio_search_index_job();

INSERT INTO public.search_index_jobs (job_key)
VALUES ('portfolio');

COMMIT;
