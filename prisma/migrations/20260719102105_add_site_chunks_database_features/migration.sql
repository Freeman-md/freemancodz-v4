CREATE INDEX "site_chunks_embedding_hnsw_idx"
ON "site_chunks"
USING hnsw ("embedding" vector_cosine_ops);

ALTER TABLE "site_chunks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "principles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "experiences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "site_chunks" FROM anon, authenticated;
REVOKE ALL ON TABLE "content_blocks" FROM anon, authenticated;
REVOKE ALL ON TABLE "principles" FROM anon, authenticated;
REVOKE ALL ON TABLE "services" FROM anon, authenticated;
REVOKE ALL ON TABLE "experiences" FROM anon, authenticated;
REVOKE ALL ON TABLE "projects" FROM anon, authenticated;
