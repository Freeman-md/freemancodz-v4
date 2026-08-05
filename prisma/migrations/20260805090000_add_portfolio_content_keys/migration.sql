ALTER TYPE "content_section" ADD VALUE IF NOT EXISTS 'services_intro';
ALTER TYPE "content_section" ADD VALUE IF NOT EXISTS 'proof_of_work';
ALTER TYPE "content_section" ADD VALUE IF NOT EXISTS 'audit_offer';
ALTER TYPE "content_section" ADD VALUE IF NOT EXISTS 'final_cta';

ALTER TABLE "principles" ADD COLUMN "key" TEXT;
ALTER TABLE "services" ADD COLUMN "key" TEXT;
ALTER TABLE "experiences" ADD COLUMN "key" TEXT;
ALTER TABLE "projects" ADD COLUMN "key" TEXT;

UPDATE "principles" SET "key" = CONCAT("principle-", "id") WHERE "key" IS NULL;
UPDATE "services" SET "key" = CONCAT("service-", "id") WHERE "key" IS NULL;
UPDATE "experiences" SET "key" = CONCAT("experience-", "id") WHERE "key" IS NULL;
UPDATE "projects" SET "key" = CONCAT("project-", "id") WHERE "key" IS NULL;

ALTER TABLE "principles" ALTER COLUMN "key" SET NOT NULL;
ALTER TABLE "services" ALTER COLUMN "key" SET NOT NULL;
ALTER TABLE "experiences" ALTER COLUMN "key" SET NOT NULL;
ALTER TABLE "projects" ALTER COLUMN "key" SET NOT NULL;

CREATE UNIQUE INDEX "principles_key_key" ON "principles"("key");
CREATE UNIQUE INDEX "services_key_key" ON "services"("key");
CREATE UNIQUE INDEX "experiences_key_key" ON "experiences"("key");
CREATE UNIQUE INDEX "projects_key_key" ON "projects"("key");
