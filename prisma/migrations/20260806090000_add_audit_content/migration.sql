ALTER TYPE "content_page" ADD VALUE IF NOT EXISTS 'audit';
ALTER TYPE "content_section" ADD VALUE IF NOT EXISTS 'audit_problem_signals';
ALTER TYPE "content_section" ADD VALUE IF NOT EXISTS 'audit_deliverable';
ALTER TYPE "content_section" ADD VALUE IF NOT EXISTS 'audit_proof';
