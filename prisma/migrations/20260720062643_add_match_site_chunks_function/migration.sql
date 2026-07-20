CREATE OR REPLACE FUNCTION public.match_site_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 6,
  match_threshold float DEFAULT 0.25
)
RETURNS TABLE (
  id text,
  source_type text,
  source_id text,
  chunk_index int,
  title text,
  category text,
  url text,
  content text,
  keywords text[],
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    sc.id,
    sc.source_type,
    sc.source_id,
    sc.chunk_index,
    sc.title,
    sc.category,
    sc.url,
    sc.content,
    sc.keywords,
    1 - (sc.embedding <=> query_embedding) AS similarity
  FROM public.site_chunks AS sc
  WHERE 1 - (sc.embedding <=> query_embedding) >= match_threshold
  ORDER BY sc.embedding <=> query_embedding
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION public.match_site_chunks(vector(1536), int, float)
FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.match_site_chunks(vector(1536), int, float)
TO service_role;
