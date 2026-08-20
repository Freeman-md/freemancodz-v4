BEGIN;

-- ContentBlock URLs are renderer identities and public provenance. Update existing
-- initialized portfolios to the key-derived section anchors used by the frontend.
UPDATE public.content_blocks
SET
  url = CASE url
    WHEN '/#home-improve-heading' THEN '/#home-improve'
    WHEN '/#home-relevant-work-heading' THEN '/#home-work'
    WHEN '/#home-audit-heading' THEN '/#home-audit'
    WHEN '/#home-closing-heading' THEN '/#home-cta'
    WHEN '/work#case-studies-heading' THEN '/work#work-relevant'
    WHEN '/work#additional-work-heading' THEN '/work#work-additional'
    WHEN '/work#work-connection-heading' THEN '/work#work-connects'
    WHEN '/about#about-journey-heading' THEN '/about#about-journey'
    WHEN '/about#product-thinking-heading' THEN '/about#about-thinking'
    WHEN '/about#work-process-heading' THEN '/about#about-work'
    WHEN '/about#exploration-heading' THEN '/about#about-explore'
    WHEN '/about#outside-engineering-heading' THEN '/about#about-outside'
    WHEN '/about#about-closing-heading' THEN '/about#about-cta'
    WHEN '/audit#audit-symptoms-heading' THEN '/audit#audit-why'
    WHEN '/audit#friction-heading' THEN '/audit#audit-before-after'
    WHEN '/audit#proof-heading' THEN '/audit#audit-proof'
    WHEN '/audit#audit-cta-heading' THEN '/audit#audit-cta'
    ELSE url
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE url IN (
  '/#home-improve-heading',
  '/#home-relevant-work-heading',
  '/#home-audit-heading',
  '/#home-closing-heading',
  '/work#case-studies-heading',
  '/work#additional-work-heading',
  '/work#work-connection-heading',
  '/about#about-journey-heading',
  '/about#product-thinking-heading',
  '/about#work-process-heading',
  '/about#exploration-heading',
  '/about#outside-engineering-heading',
  '/about#about-closing-heading',
  '/audit#audit-symptoms-heading',
  '/audit#friction-heading',
  '/audit#proof-heading',
  '/audit#audit-cta-heading'
);

COMMIT;
