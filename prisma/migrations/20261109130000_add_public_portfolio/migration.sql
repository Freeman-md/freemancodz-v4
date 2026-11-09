BEGIN;

CREATE TYPE public.portfolio_project_kind AS ENUM ('real-project', 'exploration');

CREATE TABLE public.portfolio_profiles (
  key TEXT PRIMARY KEY DEFAULT 'global',
  name TEXT NOT NULL,
  headline TEXT NOT NULL,
  intro TEXT NOT NULL,
  philosophy TEXT NOT NULL
);

CREATE TABLE public.portfolio_projects (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  kind public.portfolio_project_kind NOT NULL,
  category TEXT NOT NULL,
  company TEXT,
  cover JSONB NOT NULL,
  links JSONB NOT NULL,
  featured JSONB,
  questions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  display_order INTEGER NOT NULL
);

CREATE TABLE public.portfolio_project_case_studies (
  project_slug TEXT PRIMARY KEY REFERENCES public.portfolio_projects(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  role TEXT NOT NULL,
  problem TEXT NOT NULL,
  contribution TEXT NOT NULL,
  outcome TEXT NOT NULL,
  capabilities TEXT[] NOT NULL,
  technology_keys TEXT[] NOT NULL,
  evidence_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  before_url TEXT,
  after_url TEXT,
  service_offer JSONB,
  CONSTRAINT portfolio_case_studies_clip_pair CHECK ((before_url IS NULL) = (after_url IS NULL))
);

CREATE TABLE public.portfolio_experiences (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  period TEXT NOT NULL,
  role TEXT NOT NULL,
  label TEXT NOT NULL,
  details TEXT[] NOT NULL,
  questions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  display_order INTEGER NOT NULL
);

CREATE TABLE public.portfolio_services (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  request_draft TEXT NOT NULL,
  examples TEXT[] NOT NULL,
  questions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  display_order INTEGER NOT NULL
);

CREATE TABLE public.portfolio_project_services (
  project_slug TEXT NOT NULL REFERENCES public.portfolio_projects(slug) ON DELETE CASCADE ON UPDATE CASCADE,
  service_key TEXT NOT NULL REFERENCES public.portfolio_services(key) ON DELETE RESTRICT ON UPDATE CASCADE,
  position INTEGER NOT NULL CHECK (position > 0),
  PRIMARY KEY (project_slug, service_key),
  CONSTRAINT portfolio_project_services_project_slug_position_key UNIQUE (project_slug, position) DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX portfolio_project_services_service_key_idx ON public.portfolio_project_services(service_key);

ALTER TABLE public.portfolio_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_project_case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_project_services ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.portfolio_profiles, public.portfolio_projects,
  public.portfolio_project_case_studies, public.portfolio_experiences, public.portfolio_services,
  public.portfolio_project_services FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
