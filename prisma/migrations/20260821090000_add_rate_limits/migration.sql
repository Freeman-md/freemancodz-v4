BEGIN;

CREATE TABLE public.rate_limits (
  scope TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ(6) NOT NULL,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rate_limits_pkey PRIMARY KEY (scope, key_hash, rule_id),
  CONSTRAINT rate_limits_scope_check CHECK (NULLIF(BTRIM(scope), '') IS NOT NULL),
  CONSTRAINT rate_limits_key_hash_check CHECK (NULLIF(BTRIM(key_hash), '') IS NOT NULL),
  CONSTRAINT rate_limits_rule_id_check CHECK (NULLIF(BTRIM(rule_id), '') IS NOT NULL),
  CONSTRAINT rate_limits_count_check CHECK (count >= 0)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC, anon, authenticated;

COMMIT;
