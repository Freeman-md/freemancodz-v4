-- Supabase migrations are the sole schema history for portfolio content.
-- Prisma mirrors this schema for type-safe, server-side access only.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  headline text not null,
  intro text not null,
  hero_note text not null,
  philosophy_question text not null,
  about_headline text not null,
  current_direction text not null,
  current_direction_support text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.educations (
  id uuid primary key default gen_random_uuid(),
  current text not null,
  previous text not null,
  research text not null,
  support text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.principles (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('home', 'about')),
  title text not null,
  body text not null,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section, position)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  lead text not null,
  description text not null,
  cta text not null,
  assistant_prompt text,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (position)
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('about_intro', 'work_process', 'outside_engineering')),
  title text,
  body text not null,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section, position),
  check ((section = 'outside_engineering') = (title is not null))
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  dates text not null,
  location text,
  category text not null,
  focus text not null,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (position)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  summary text not null,
  category text not null,
  role text not null,
  outcome text not null,
  detail text not null,
  future text,
  collaboration text,
  positioning text,
  featured boolean not null default false,
  position integer not null check (position >= 0),
  stacks text[] not null default '{}',
  links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (position)
);

create index principles_section_position_idx on public.principles (section, position);
create index content_items_section_position_idx on public.content_items (section, position);
create index projects_featured_position_idx on public.projects (featured, position);

alter table public.profiles enable row level security;
alter table public.educations enable row level security;
alter table public.principles enable row level security;
alter table public.services enable row level security;
alter table public.content_items enable row level security;
alter table public.experiences enable row level security;
alter table public.projects enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.educations from anon, authenticated;
revoke all on table public.principles from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.content_items from anon, authenticated;
revoke all on table public.experiences from anon, authenticated;
revoke all on table public.projects from anon, authenticated;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_educations_updated_at before update on public.educations for each row execute function public.set_updated_at();
create trigger set_principles_updated_at before update on public.principles for each row execute function public.set_updated_at();
create trigger set_services_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger set_content_items_updated_at before update on public.content_items for each row execute function public.set_updated_at();
create trigger set_experiences_updated_at before update on public.experiences for each row execute function public.set_updated_at();
create trigger set_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
