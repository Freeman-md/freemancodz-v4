CREATE TABLE public.portfolio_search_documents (
  key TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('project', 'experience', 'service', 'profile')),
  source_key TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  embedding vector(1536) NOT NULL
);

ALTER TABLE public.portfolio_search_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.portfolio_search_documents FROM PUBLIC, anon, authenticated, service_role;
