-- ============================================================
-- Vector search
-- ============================================================

CREATE INDEX "site_chunks_embedding_hnsw_idx"
ON "site_chunks"
USING hnsw ("embedding" vector_cosine_ops);


-- ============================================================
-- Row-level security
--
-- The application accesses these tables through Prisma using
-- the server-side database connection.
--
-- No anon or authenticated policies are intentionally created.
-- This prevents direct browser access through Supabase PostgREST.
-- ============================================================

ALTER TABLE "site_chunks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "principles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "experiences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- Explicitly remove direct Supabase client privileges
-- ============================================================

REVOKE ALL ON TABLE "site_chunks" FROM anon, authenticated;
REVOKE ALL ON TABLE "content_blocks" FROM anon, authenticated;
REVOKE ALL ON TABLE "principles" FROM anon, authenticated;
REVOKE ALL ON TABLE "services" FROM anon, authenticated;
REVOKE ALL ON TABLE "experiences" FROM anon, authenticated;
REVOKE ALL ON TABLE "projects" FROM anon, authenticated;