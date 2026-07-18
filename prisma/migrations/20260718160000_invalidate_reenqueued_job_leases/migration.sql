-- A source write supersedes any in-flight worker lease. The old worker must not
-- be able to acknowledge or retry the newer queued operation.
CREATE OR REPLACE FUNCTION public.enqueue_search_index_job() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE source_type text := TG_ARGV[0]; source_id text := COALESCE(NEW.id, OLD.id)::text;
BEGIN
  INSERT INTO "search_index_jobs" ("sourceType", "sourceId", "operation", "available_at", "locked_at", "lock_token", "last_error", "updated_at")
  VALUES (source_type, source_id, CASE WHEN TG_OP = 'DELETE' THEN 'delete' ELSE 'upsert' END, NOW(), NULL, NULL, NULL, NOW())
  ON CONFLICT ("sourceType", "sourceId") DO UPDATE SET
    "operation" = EXCLUDED."operation",
    "available_at" = NOW(),
    "locked_at" = NULL,
    "lock_token" = NULL,
    "last_error" = NULL,
    "updated_at" = NOW();
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
