create type public.content_page as enum ('home', 'about');

create type public.content_section as enum (
  'hero',
  'philosophy',
  'current_direction',
  'about_header',
  'about_intro',
  'education',
  'work_process',
  'outside_engineering'
);

create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  page public.content_page not null,
  section public.content_section not null,
  position integer not null default 0 check (position >= 0),
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page, section, position)
);

create index content_blocks_page_section_position_idx
  on public.content_blocks (page, section, position);

alter table public.content_blocks enable row level security;

revoke all on table public.content_blocks from anon, authenticated;

create trigger set_content_blocks_updated_at
  before update on public.content_blocks
  for each row execute function public.set_updated_at();

drop table public.profiles;
drop table public.educations;
drop table public.content_items;
