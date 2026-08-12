-- Retire only the legacy portfolio indexing hooks before replacing their tables.
DROP TRIGGER IF EXISTS "content_blocks_search_index_job" ON public.content_blocks;
DROP TRIGGER IF EXISTS "projects_search_index_job" ON public.projects;
DROP TRIGGER IF EXISTS "services_search_index_job" ON public.services;
DROP TRIGGER IF EXISTS "principles_search_index_job" ON public.principles;
DROP TRIGGER IF EXISTS "experiences_search_index_job" ON public.experiences;

DROP TABLE public.content_blocks;
DROP TABLE public.principles;
DROP TABLE public.services;
DROP TABLE public.experiences;
DROP TABLE public.projects;
DROP TYPE public.content_page;
DROP TYPE public.content_section;

CREATE TYPE public.profile_icon_collection AS ENUM (
  'audience', 'principles', 'thinking_principles', 'process_principles',
  'control_principles', 'outcomes'
);
CREATE TYPE public.media_type AS ENUM ('image', 'video');
CREATE TYPE public.action_variant AS ENUM ('primary', 'secondary', 'ghost', 'link');

CREATE TABLE public.profiles (
  id TEXT NOT NULL DEFAULT 'global',
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  positioning TEXT NOT NULL,
  email TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  github_url TEXT NOT NULL,
  cover_image TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_singleton_check CHECK (id = 'global')
);

CREATE TABLE public.content_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  eyebrow TEXT,
  title TEXT,
  copy TEXT,
  url TEXT NOT NULL,
  "order" INTEGER,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT content_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT content_blocks_top_level_order_check CHECK ("order" IS NULL OR "order" > 0)
);

CREATE TABLE public.icon_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  icon_name TEXT,
  label TEXT NOT NULL,
  copy TEXT,
  colour TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT icon_blocks_pkey PRIMARY KEY (id)
);

CREATE TABLE public.media_blocks (
  id UUID NOT NULL,
  type public.media_type NOT NULL,
  source TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  CONSTRAINT media_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT media_blocks_icon_block_fkey FOREIGN KEY (id) REFERENCES public.icon_blocks(id) ON DELETE CASCADE
);

CREATE TABLE public.action_blocks (
  id UUID NOT NULL,
  variant public.action_variant NOT NULL,
  url TEXT,
  assistant_message TEXT,
  CONSTRAINT action_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT action_blocks_icon_block_fkey FOREIGN KEY (id) REFERENCES public.icon_blocks(id) ON DELETE CASCADE,
  CONSTRAINT action_blocks_behaviour_check CHECK (
    NULLIF(BTRIM(url), '') IS NOT NULL OR NULLIF(BTRIM(assistant_message), '') IS NOT NULL
  )
);

CREATE TABLE public.content_block_icon_blocks (
  content_block_id UUID NOT NULL,
  icon_block_id UUID NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT content_block_icon_blocks_pkey PRIMARY KEY (content_block_id, icon_block_id),
  CONSTRAINT content_block_icon_blocks_order_check CHECK ("order" > 0),
  CONSTRAINT content_block_icon_blocks_content_fkey FOREIGN KEY (content_block_id) REFERENCES public.content_blocks(id) ON DELETE CASCADE,
  CONSTRAINT content_block_icon_blocks_icon_fkey FOREIGN KEY (icon_block_id) REFERENCES public.icon_blocks(id) ON DELETE RESTRICT
);

CREATE TABLE public.content_block_media_blocks (
  content_block_id UUID NOT NULL,
  media_block_id UUID NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT content_block_media_blocks_pkey PRIMARY KEY (content_block_id, media_block_id),
  CONSTRAINT content_block_media_blocks_order_check CHECK ("order" > 0),
  CONSTRAINT content_block_media_blocks_content_fkey FOREIGN KEY (content_block_id) REFERENCES public.content_blocks(id) ON DELETE CASCADE,
  CONSTRAINT content_block_media_blocks_media_fkey FOREIGN KEY (media_block_id) REFERENCES public.media_blocks(id) ON DELETE RESTRICT
);

CREATE TABLE public.content_block_action_blocks (
  content_block_id UUID NOT NULL,
  action_block_id UUID NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT content_block_action_blocks_pkey PRIMARY KEY (content_block_id, action_block_id),
  CONSTRAINT content_block_action_blocks_order_check CHECK ("order" > 0),
  CONSTRAINT content_block_action_blocks_content_fkey FOREIGN KEY (content_block_id) REFERENCES public.content_blocks(id) ON DELETE CASCADE,
  CONSTRAINT content_block_action_blocks_action_fkey FOREIGN KEY (action_block_id) REFERENCES public.action_blocks(id) ON DELETE RESTRICT
);

CREATE TABLE public.content_block_children (
  parent_id UUID NOT NULL,
  child_id UUID NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT content_block_children_pkey PRIMARY KEY (parent_id, child_id),
  CONSTRAINT content_block_children_child_key UNIQUE (child_id),
  CONSTRAINT content_block_children_order_check CHECK ("order" > 0),
  CONSTRAINT content_block_children_no_self_check CHECK (parent_id <> child_id),
  CONSTRAINT content_block_children_parent_fkey FOREIGN KEY (parent_id) REFERENCES public.content_blocks(id) ON DELETE CASCADE,
  CONSTRAINT content_block_children_child_fkey FOREIGN KEY (child_id) REFERENCES public.content_blocks(id) ON DELETE CASCADE
);

CREATE TABLE public.profile_icon_blocks (
  profile_id TEXT NOT NULL,
  icon_block_id UUID NOT NULL,
  collection public.profile_icon_collection NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT profile_icon_blocks_pkey PRIMARY KEY (profile_id, collection, icon_block_id),
  CONSTRAINT profile_icon_blocks_order_check CHECK ("order" > 0),
  CONSTRAINT profile_icon_blocks_profile_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT profile_icon_blocks_icon_fkey FOREIGN KEY (icon_block_id) REFERENCES public.icon_blocks(id) ON DELETE RESTRICT
);

CREATE TABLE public.experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  tag TEXT,
  copy TEXT NOT NULL,
  insight TEXT,
  role TEXT,
  start_date DATE,
  end_date DATE,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT experiences_pkey PRIMARY KEY (id),
  CONSTRAINT experiences_order_check CHECK ("order" > 0)
);

CREATE TABLE public.experience_icon_blocks (
  experience_id UUID NOT NULL,
  icon_block_id UUID NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT experience_icon_blocks_pkey PRIMARY KEY (experience_id, icon_block_id),
  CONSTRAINT experience_icon_blocks_order_check CHECK ("order" > 0),
  CONSTRAINT experience_icon_blocks_experience_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id) ON DELETE CASCADE,
  CONSTRAINT experience_icon_blocks_icon_fkey FOREIGN KEY (icon_block_id) REFERENCES public.icon_blocks(id) ON DELETE RESTRICT
);

CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  outcome TEXT,
  cover_id UUID,
  external_links TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  featured BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL,
  markdown TEXT,
  visual_block TEXT,
  visual_text TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_order_check CHECK ("order" > 0),
  CONSTRAINT projects_cover_fkey FOREIGN KEY (cover_id) REFERENCES public.media_blocks(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX content_block_icon_blocks_content_block_id_order_key ON public.content_block_icon_blocks(content_block_id, "order");
CREATE UNIQUE INDEX content_block_media_blocks_content_block_id_order_key ON public.content_block_media_blocks(content_block_id, "order");
CREATE UNIQUE INDEX content_block_action_blocks_content_block_id_order_key ON public.content_block_action_blocks(content_block_id, "order");
CREATE UNIQUE INDEX content_block_children_parent_id_order_key ON public.content_block_children(parent_id, "order");
CREATE UNIQUE INDEX profile_icon_blocks_profile_id_collection_order_key ON public.profile_icon_blocks(profile_id, collection, "order");
CREATE UNIQUE INDEX experience_icon_blocks_experience_id_order_key ON public.experience_icon_blocks(experience_id, "order");
CREATE UNIQUE INDEX experiences_order_key ON public.experiences("order");
CREATE UNIQUE INDEX projects_slug_key ON public.projects(slug);
CREATE UNIQUE INDEX projects_title_key ON public.projects(title);
CREATE UNIQUE INDEX projects_cover_id_key ON public.projects(cover_id);
CREATE UNIQUE INDEX projects_order_key ON public.projects("order");
CREATE INDEX content_blocks_url_order_idx ON public.content_blocks(url, "order");
CREATE INDEX content_block_icon_blocks_icon_block_id_idx ON public.content_block_icon_blocks(icon_block_id);
CREATE INDEX content_block_media_blocks_media_block_id_idx ON public.content_block_media_blocks(media_block_id);
CREATE INDEX content_block_action_blocks_action_block_id_idx ON public.content_block_action_blocks(action_block_id);
CREATE INDEX profile_icon_blocks_icon_block_id_idx ON public.profile_icon_blocks(icon_block_id);
CREATE INDEX experience_icon_blocks_icon_block_id_idx ON public.experience_icon_blocks(icon_block_id);
CREATE INDEX projects_featured_order_idx ON public.projects(featured, "order");

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icon_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_block_icon_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_block_media_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_block_action_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_block_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_icon_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_icon_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.profiles, public.content_blocks, public.icon_blocks,
  public.media_blocks, public.action_blocks, public.content_block_icon_blocks,
  public.content_block_media_blocks, public.content_block_action_blocks,
  public.content_block_children, public.profile_icon_blocks, public.experiences,
  public.experience_icon_blocks, public.projects FROM anon, authenticated;
