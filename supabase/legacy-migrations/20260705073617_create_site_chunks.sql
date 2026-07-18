create extension if not exists vector;

create table public.site_chunks (
  id text primary key,
  title text not null,
  category text not null,
  url text not null,
  content text not null,
  keywords text[] not null default '{}',
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_chunks enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_site_chunks_updated_at
before update on public.site_chunks
for each row
execute function public.set_updated_at();

create or replace function public.match_site_chunks(
  query_embedding vector(1536),
  match_count int default 4,
  match_threshold float default 0.35
)
returns table (
  id text,
  title text,
  category text,
  url text,
  content text,
  keywords text[],
  similarity float
)
language sql
stable
as $$
  select
    site_chunks.id,
    site_chunks.title,
    site_chunks.category,
    site_chunks.url,
    site_chunks.content,
    site_chunks.keywords,
    1 - (site_chunks.embedding <=> query_embedding) as similarity
  from public.site_chunks
  where 1 - (site_chunks.embedding <=> query_embedding) >= match_threshold
  order by site_chunks.embedding <=> query_embedding
  limit match_count;
$$;

revoke all on public.site_chunks from anon, authenticated;
revoke all on function public.match_site_chunks(vector(1536), int, float) from public, anon, authenticated;
grant execute on function public.match_site_chunks(vector(1536), int, float) to service_role;
