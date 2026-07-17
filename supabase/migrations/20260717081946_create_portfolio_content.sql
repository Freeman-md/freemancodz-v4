-- Supabase migrations are the sole schema history for portfolio content.
-- Prisma mirrors this schema for type-safe, server-side access only.

create extension if not exists pgcrypto;

create table public.portfolio_profiles (
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

create table public.profile_educations (
  profile_id uuid primary key references public.portfolio_profiles(id) on delete cascade,
  current text not null,
  previous text not null,
  research text not null,
  support text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_principles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.portfolio_profiles(id) on delete cascade,
  section text not null check (section in ('home', 'about')),
  title text not null,
  body text not null,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, section, position)
);

create table public.profile_services (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.portfolio_profiles(id) on delete cascade,
  title text not null,
  lead text not null,
  description text not null,
  cta text not null,
  assistant_prompt text,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, position)
);

create table public.profile_content_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.portfolio_profiles(id) on delete cascade,
  section text not null check (section in ('about_intro', 'work_process', 'outside_engineering')),
  title text,
  body text not null,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, section, position),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (position)
);

create table public.project_stacks (
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  position integer not null check (position >= 0),
  primary key (project_id, position),
  unique (project_id, name)
);

create table public.project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null,
  href text not null,
  position integer not null check (position >= 0),
  unique (project_id, position)
);

create index profile_principles_profile_section_position_idx on public.profile_principles (profile_id, section, position);
create index profile_content_items_profile_section_position_idx on public.profile_content_items (profile_id, section, position);
create index projects_featured_position_idx on public.projects (featured, position);

alter table public.portfolio_profiles enable row level security;
alter table public.profile_educations enable row level security;
alter table public.profile_principles enable row level security;
alter table public.profile_services enable row level security;
alter table public.profile_content_items enable row level security;
alter table public.experiences enable row level security;
alter table public.projects enable row level security;
alter table public.project_stacks enable row level security;
alter table public.project_links enable row level security;

revoke all on table public.portfolio_profiles from anon, authenticated;
revoke all on table public.profile_educations from anon, authenticated;
revoke all on table public.profile_principles from anon, authenticated;
revoke all on table public.profile_services from anon, authenticated;
revoke all on table public.profile_content_items from anon, authenticated;
revoke all on table public.experiences from anon, authenticated;
revoke all on table public.projects from anon, authenticated;
revoke all on table public.project_stacks from anon, authenticated;
revoke all on table public.project_links from anon, authenticated;

create trigger set_portfolio_profiles_updated_at before update on public.portfolio_profiles for each row execute function public.set_updated_at();
create trigger set_profile_educations_updated_at before update on public.profile_educations for each row execute function public.set_updated_at();
create trigger set_profile_principles_updated_at before update on public.profile_principles for each row execute function public.set_updated_at();
create trigger set_profile_services_updated_at before update on public.profile_services for each row execute function public.set_updated_at();
create trigger set_profile_content_items_updated_at before update on public.profile_content_items for each row execute function public.set_updated_at();
create trigger set_experiences_updated_at before update on public.experiences for each row execute function public.set_updated_at();
create trigger set_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
