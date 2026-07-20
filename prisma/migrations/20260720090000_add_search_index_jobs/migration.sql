-- CreateTable
CREATE TABLE "search_index_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operation" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimed_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),

    CONSTRAINT "search_index_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_index_jobs_status_available_at_idx"
ON "search_index_jobs"("status", "available_at");

-- CreateIndex
CREATE INDEX "search_index_jobs_source_type_source_id_idx"
ON "search_index_jobs"("source_type", "source_id");

-- Keep one coalescible pending job per source without preventing historical jobs.
CREATE UNIQUE INDEX "search_index_jobs_pending_unique"
ON "search_index_jobs" ("source_type", "source_id")
WHERE "status" = 'pending';

CREATE OR REPLACE FUNCTION public.enqueue_search_index_job()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  job_operation TEXT;
  job_source_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    job_operation := 'delete';
    job_source_id := OLD.id::TEXT;
  ELSE
    job_operation := 'upsert';
    job_source_id := NEW.id::TEXT;
  END IF;

  INSERT INTO public.search_index_jobs (
    operation,
    source_type,
    source_id,
    status,
    attempts,
    available_at,
    last_error
  )
  VALUES (
    job_operation,
    TG_ARGV[0],
    job_source_id,
    'pending',
    0,
    NOW(),
    NULL
  )
  ON CONFLICT (source_type, source_id) WHERE status = 'pending'
  DO UPDATE SET
    operation = EXCLUDED.operation,
    available_at = NOW(),
    last_error = NULL;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS "content_blocks_search_index_job" ON public.content_blocks;
CREATE TRIGGER "content_blocks_search_index_job"
AFTER INSERT OR UPDATE OR DELETE ON public.content_blocks
FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('content_blocks');

DROP TRIGGER IF EXISTS "projects_search_index_job" ON public.projects;
CREATE TRIGGER "projects_search_index_job"
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('projects');

DROP TRIGGER IF EXISTS "services_search_index_job" ON public.services;
CREATE TRIGGER "services_search_index_job"
AFTER INSERT OR UPDATE OR DELETE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('services');

DROP TRIGGER IF EXISTS "principles_search_index_job" ON public.principles;
CREATE TRIGGER "principles_search_index_job"
AFTER INSERT OR UPDATE OR DELETE ON public.principles
FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('principles');

DROP TRIGGER IF EXISTS "experiences_search_index_job" ON public.experiences;
CREATE TRIGGER "experiences_search_index_job"
AFTER INSERT OR UPDATE OR DELETE ON public.experiences
FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('experiences');
