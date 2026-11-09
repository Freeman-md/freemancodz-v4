BEGIN;

CREATE TEMP TABLE audit_before_after_subtree (
  id UUID PRIMARY KEY
) ON COMMIT DROP;

DO $$
DECLARE
  before_after_root_id UUID;
  before_after_root_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO before_after_root_count
  FROM public.content_blocks AS block
  WHERE block.url = '/audit#audit-before-after'
    AND NOT EXISTS (
      SELECT 1
      FROM public.content_block_children AS relation
      WHERE relation.child_id = block.id
    );

  IF before_after_root_count = 0 AND NOT EXISTS (SELECT 1 FROM public.content_blocks) THEN
    RETURN;
  END IF;

  IF before_after_root_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one Before/After audit root, found %.', before_after_root_count;
  END IF;

  SELECT block.id
  INTO before_after_root_id
  FROM public.content_blocks AS block
  WHERE block.url = '/audit#audit-before-after'
    AND NOT EXISTS (
      SELECT 1
      FROM public.content_block_children AS relation
      WHERE relation.child_id = block.id
    );

  WITH RECURSIVE descendants(id) AS (
    SELECT before_after_root_id
    UNION
    SELECT relation.child_id
    FROM public.content_block_children AS relation
    INNER JOIN descendants ON descendants.id = relation.parent_id
  )
  INSERT INTO audit_before_after_subtree (id)
  SELECT id FROM descendants;
END $$;

CREATE TEMP TABLE obsolete_audit_icon_blocks ON COMMIT DROP AS
SELECT DISTINCT relation.icon_block_id AS id
FROM public.content_block_icon_blocks AS relation
INNER JOIN audit_before_after_subtree AS subtree ON subtree.id = relation.content_block_id;

DELETE FROM public.content_blocks AS block
USING audit_before_after_subtree AS subtree
WHERE block.id = subtree.id;

DELETE FROM public.icon_blocks AS block
USING obsolete_audit_icon_blocks AS obsolete
WHERE block.id = obsolete.id
  AND NOT EXISTS (
    SELECT 1
    FROM public.content_block_icon_blocks AS relation
    WHERE relation.icon_block_id = block.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.profile_icon_blocks AS relation
    WHERE relation.icon_block_id = block.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.experience_icon_blocks AS relation
    WHERE relation.icon_block_id = block.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.media_blocks AS media
    WHERE media.id = block.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.action_blocks AS action
    WHERE action.id = block.id
  );

DO $$
DECLARE
  process_root_count INTEGER;
  symptoms_root_count INTEGER;
  proof_root_count INTEGER;
  cta_root_count INTEGER;
  process_root_id UUID;
  context_id UUID;
  inspect_id UUID;
  prioritise_id UUID;
  action_id UUID;
BEGIN
  SELECT COUNT(*) INTO process_root_count
  FROM public.content_blocks AS block
  WHERE block.url = '/audit#audit-process'
    AND NOT EXISTS (
      SELECT 1 FROM public.content_block_children AS relation WHERE relation.child_id = block.id
    );

  IF process_root_count <> 0 THEN
    RAISE EXCEPTION 'Expected no audit process root before migration, found %.', process_root_count;
  END IF;

  SELECT COUNT(*) INTO symptoms_root_count
  FROM public.content_blocks AS block
  WHERE block.url = '/audit#audit-why'
    AND NOT EXISTS (
      SELECT 1 FROM public.content_block_children AS relation WHERE relation.child_id = block.id
    );

  SELECT COUNT(*) INTO proof_root_count
  FROM public.content_blocks AS block
  WHERE block.url = '/audit#audit-proof'
    AND NOT EXISTS (
      SELECT 1 FROM public.content_block_children AS relation WHERE relation.child_id = block.id
    );

  SELECT COUNT(*) INTO cta_root_count
  FROM public.content_blocks AS block
  WHERE block.url = '/audit#audit-cta'
    AND NOT EXISTS (
      SELECT 1 FROM public.content_block_children AS relation WHERE relation.child_id = block.id
    );

  IF symptoms_root_count = 0 AND proof_root_count = 0 AND cta_root_count = 0
    AND NOT EXISTS (SELECT 1 FROM public.content_blocks) THEN
    RETURN;
  END IF;

  IF symptoms_root_count <> 1 OR proof_root_count <> 1 OR cta_root_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one audit symptoms, proof, and CTA root.';
  END IF;

  UPDATE public.content_blocks AS block
  SET "order" = 3, updated_at = CURRENT_TIMESTAMP
  WHERE block.url = '/audit#audit-why'
    AND NOT EXISTS (
      SELECT 1 FROM public.content_block_children AS relation WHERE relation.child_id = block.id
    );

  UPDATE public.content_blocks AS block
  SET "order" = 4, updated_at = CURRENT_TIMESTAMP
  WHERE block.url = '/audit#audit-proof'
    AND NOT EXISTS (
      SELECT 1 FROM public.content_block_children AS relation WHERE relation.child_id = block.id
    );

  UPDATE public.content_blocks AS block
  SET "order" = 5, updated_at = CURRENT_TIMESTAMP
  WHERE block.url = '/audit#audit-cta'
    AND NOT EXISTS (
      SELECT 1 FROM public.content_block_children AS relation WHERE relation.child_id = block.id
    );

  INSERT INTO public.content_blocks (eyebrow, title, copy, url, "order")
  VALUES (
    'What happens',
    'From unclear friction to a prioritised next action.',
    'A focused review of one important customer journey or operational workflow.',
    '/audit#audit-process',
    2
  )
  RETURNING id INTO process_root_id;

  INSERT INTO public.content_blocks (title, copy, url, "order")
  VALUES ('You provide context', 'One important journey or workflow.', '/audit#audit-process', NULL)
  RETURNING id INTO context_id;

  INSERT INTO public.content_blocks (title, copy, url, "order")
  VALUES ('The path is inspected', 'Customer steps and operational handoffs.', '/audit#audit-process', NULL)
  RETURNING id INTO inspect_id;

  INSERT INTO public.content_blocks (title, copy, url, "order")
  VALUES ('Findings are prioritised', 'The points with the clearest friction.', '/audit#audit-process', NULL)
  RETURNING id INTO prioritise_id;

  INSERT INTO public.content_blocks (title, copy, url, "order")
  VALUES ('A next action becomes clear', 'You choose what happens after review.', '/audit#audit-process', NULL)
  RETURNING id INTO action_id;

  INSERT INTO public.content_block_children (parent_id, child_id, "order")
  VALUES
    (process_root_id, context_id, 1),
    (process_root_id, inspect_id, 2),
    (process_root_id, prioritise_id, 3),
    (process_root_id, action_id, 4);
END $$;

COMMIT;
