ALTER TYPE "content_section" ADD VALUE IF NOT EXISTS 'services_intro';
ALTER TYPE "content_section" ADD VALUE IF NOT EXISTS 'proof_of_work';
ALTER TYPE "content_section" ADD VALUE IF NOT EXISTS 'audit_offer';
ALTER TYPE "content_section" ADD VALUE IF NOT EXISTS 'final_cta';

ALTER TABLE "principles" ADD COLUMN "key" TEXT;
ALTER TABLE "services" ADD COLUMN "key" TEXT;
ALTER TABLE "experiences" ADD COLUMN "key" TEXT;
ALTER TABLE "projects" ADD COLUMN "key" TEXT;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "services" WHERE "key" IS NULL AND "title" IN ('Customer-Facing Assistants', 'Customer Journeys')) > 1 THEN
    RAISE EXCEPTION 'Cannot assign stable key customer-journeys: multiple matching services exist';
  END IF;

  IF (SELECT COUNT(*) FROM "services" WHERE "key" IS NULL AND "title" = 'Operational Workflows') > 1 THEN
    RAISE EXCEPTION 'Cannot assign stable key operational-workflows: multiple matching services exist';
  END IF;

  IF EXISTS (SELECT 1 FROM "projects" WHERE "key" IS NULL AND "title" IN ('Pay4Me / WithRadius', 'Creator Lab', 'Email PA', 'AcrossTheHorizon', 'Internal Ops Automation System') GROUP BY "title" HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Cannot assign project stable keys: multiple recognised project titles exist';
  END IF;

  IF EXISTS (SELECT 1 FROM "experiences" WHERE "key" IS NULL AND "title" IN ('Pay4Me / WithRadius', 'Hippodrome Casino', 'MSc Computer Science') GROUP BY "title" HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Cannot assign experience stable keys: multiple recognised experience titles exist';
  END IF;

  IF EXISTS (SELECT 1 FROM "principles" WHERE "key" IS NULL AND ("section", "title") IN (('home', 'Keep it simple'), ('home', 'Reliability first'), ('home', 'Engineering judgement'), ('home', 'Think long-term'), ('home', 'Make it observable'), ('about', 'Clarity before complexity'), ('about', 'Reliability before cleverness'), ('about', 'Systems should be observable'), ('about', 'Engineering judgement')) GROUP BY "section", "title" HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Cannot assign principle stable keys: multiple recognised principle records exist';
  END IF;
END $$;

UPDATE "services" SET "key" = CASE "title"
  WHEN 'Customer-Facing Assistants' THEN 'customer-journeys'
  WHEN 'Customer Journeys' THEN 'customer-journeys'
  WHEN 'Operational Workflows' THEN 'operational-workflows'
END
WHERE "key" IS NULL AND "title" IN ('Customer-Facing Assistants', 'Customer Journeys', 'Operational Workflows');

UPDATE "projects" SET "key" = CASE "title"
  WHEN 'Pay4Me / WithRadius' THEN 'pay4me-withradius'
  WHEN 'Creator Lab' THEN 'creator-lab'
  WHEN 'Email PA' THEN 'email-pa'
  WHEN 'AcrossTheHorizon' THEN 'across-the-horizon'
  WHEN 'Internal Ops Automation System' THEN 'internal-ops-automation'
END
WHERE "key" IS NULL AND "title" IN ('Pay4Me / WithRadius', 'Creator Lab', 'Email PA', 'AcrossTheHorizon', 'Internal Ops Automation System');

UPDATE "experiences" SET "key" = CASE "title"
  WHEN 'Pay4Me / WithRadius' THEN 'pay4me-experience'
  WHEN 'Hippodrome Casino' THEN 'hippodrome-casino'
  WHEN 'MSc Computer Science' THEN 'msc-computer-science'
END
WHERE "key" IS NULL AND "title" IN ('Pay4Me / WithRadius', 'Hippodrome Casino', 'MSc Computer Science');

UPDATE "principles" SET "key" = CASE
  WHEN "section" = 'home' AND "title" = 'Keep it simple' THEN 'home-keep-it-simple'
  WHEN "section" = 'home' AND "title" = 'Reliability first' THEN 'home-reliability-first'
  WHEN "section" = 'home' AND "title" = 'Engineering judgement' THEN 'home-engineering-judgement'
  WHEN "section" = 'home' AND "title" = 'Think long-term' THEN 'home-think-long-term'
  WHEN "section" = 'home' AND "title" = 'Make it observable' THEN 'home-make-it-observable'
  WHEN "section" = 'about' AND "title" = 'Clarity before complexity' THEN 'about-clarity-before-complexity'
  WHEN "section" = 'about' AND "title" = 'Reliability before cleverness' THEN 'about-reliability-before-cleverness'
  WHEN "section" = 'about' AND "title" = 'Systems should be observable' THEN 'about-systems-should-be-observable'
  WHEN "section" = 'about' AND "title" = 'Engineering judgement' THEN 'about-engineering-judgement'
END
WHERE "key" IS NULL;

UPDATE "principles" SET "key" = CONCAT('principle-', "id") WHERE "key" IS NULL;
UPDATE "services" SET "key" = CONCAT('service-', "id") WHERE "key" IS NULL;
UPDATE "experiences" SET "key" = CONCAT('experience-', "id") WHERE "key" IS NULL;
UPDATE "projects" SET "key" = CONCAT('project-', "id") WHERE "key" IS NULL;

ALTER TABLE "principles" ALTER COLUMN "key" SET NOT NULL;
ALTER TABLE "services" ALTER COLUMN "key" SET NOT NULL;
ALTER TABLE "experiences" ALTER COLUMN "key" SET NOT NULL;
ALTER TABLE "projects" ALTER COLUMN "key" SET NOT NULL;

CREATE UNIQUE INDEX "principles_key_key" ON "principles"("key");
CREATE UNIQUE INDEX "services_key_key" ON "services"("key");
CREATE UNIQUE INDEX "experiences_key_key" ON "experiences"("key");
CREATE UNIQUE INDEX "projects_key_key" ON "projects"("key");
