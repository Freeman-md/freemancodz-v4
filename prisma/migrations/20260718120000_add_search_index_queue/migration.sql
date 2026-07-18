CREATE TABLE "search_index_jobs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "sourceType" TEXT NOT NULL, "sourceId" TEXT NOT NULL,
  "operation" TEXT NOT NULL CHECK ("operation" IN ('upsert', 'delete')), "attempts" INTEGER NOT NULL DEFAULT 0,
  "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "locked_at" TIMESTAMPTZ(6), "last_error" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "search_index_jobs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "search_index_jobs_sourceType_sourceId_key" ON "search_index_jobs" ("sourceType", "sourceId");
CREATE INDEX "search_index_jobs_available_at_idx" ON "search_index_jobs" ("available_at");
ALTER TABLE "search_index_jobs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "search_index_jobs" FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS "site_chunks_embedding_hnsw_idx" ON "site_chunks" USING hnsw ("embedding" vector_cosine_ops);

CREATE OR REPLACE FUNCTION public.enqueue_search_index_job() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE source_type text := TG_ARGV[0]; source_id text := COALESCE(NEW.id, OLD.id)::text;
BEGIN
  INSERT INTO "search_index_jobs" ("sourceType", "sourceId", "operation", "available_at", "locked_at", "last_error", "updated_at") VALUES (source_type, source_id, CASE WHEN TG_OP = 'DELETE' THEN 'delete' ELSE 'upsert' END, NOW(), NULL, NULL, NOW())
  ON CONFLICT ("sourceType", "sourceId") DO UPDATE SET "operation" = EXCLUDED."operation", "available_at" = NOW(), "locked_at" = NULL, "last_error" = NULL, "updated_at" = NOW();
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER projects_index_insert AFTER INSERT ON "projects" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('projects');
CREATE TRIGGER projects_index_delete AFTER DELETE ON "projects" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('projects');
CREATE TRIGGER projects_index_update AFTER UPDATE OF "title", "summary", "category", "role", "outcome", "detail", "future", "collaboration", "positioning", "stacks" ON "projects" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('projects');
CREATE TRIGGER services_index_insert AFTER INSERT ON "services" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('services');
CREATE TRIGGER services_index_delete AFTER DELETE ON "services" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('services');
CREATE TRIGGER services_index_update AFTER UPDATE OF "title", "lead", "description", "assistant_prompt" ON "services" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('services');
CREATE TRIGGER principles_index_insert AFTER INSERT ON "principles" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('principles');
CREATE TRIGGER principles_index_delete AFTER DELETE ON "principles" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('principles');
CREATE TRIGGER principles_index_update AFTER UPDATE OF "section", "title", "body" ON "principles" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('principles');
CREATE TRIGGER experiences_index_insert AFTER INSERT ON "experiences" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('experiences');
CREATE TRIGGER experiences_index_delete AFTER DELETE ON "experiences" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('experiences');
CREATE TRIGGER experiences_index_update AFTER UPDATE OF "title", "company", "dates", "location", "category", "focus" ON "experiences" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('experiences');
CREATE TRIGGER content_blocks_index_insert AFTER INSERT ON "content_blocks" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('content_blocks');
CREATE TRIGGER content_blocks_index_delete AFTER DELETE ON "content_blocks" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('content_blocks');
CREATE TRIGGER content_blocks_index_update AFTER UPDATE OF "key", "page", "section", "content" ON "content_blocks" FOR EACH ROW EXECUTE FUNCTION public.enqueue_search_index_job('content_blocks');
