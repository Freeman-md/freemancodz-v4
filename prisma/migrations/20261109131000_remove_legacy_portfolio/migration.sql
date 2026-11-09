BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.portfolio_profiles WHERE key = 'global')
    OR NOT EXISTS (SELECT 1 FROM public.portfolio_projects WHERE featured IS NOT NULL)
    OR NOT EXISTS (SELECT 1 FROM public.portfolio_experiences)
    OR NOT EXISTS (SELECT 1 FROM public.portfolio_services)
  THEN
    RAISE EXCEPTION 'Apply the portfolio seed before removing the legacy tables.';
  END IF;
END $$;

DROP FUNCTION public.match_site_chunks;

-- Dropping these tables also drops the legacy search triggers attached to them.
DROP TABLE
  public.content_block_children,
  public.content_block_icon_blocks,
  public.content_block_media_blocks,
  public.content_block_action_blocks,
  public.profile_icon_blocks,
  public.experience_icon_blocks,
  public.projects,
  public.profiles,
  public.experiences,
  public.content_blocks,
  public.action_blocks,
  public.media_blocks,
  public.icon_blocks;

DROP FUNCTION public.enqueue_portfolio_search_index_job();
DROP TABLE public.search_index_jobs, public.site_chunks;
DROP TYPE public.profile_icon_collection, public.media_type, public.action_variant;

COMMIT;
