-- Enable pgvector before creating site_chunks
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "content_page" AS ENUM ('home', 'about');

-- CreateEnum
CREATE TYPE "content_section" AS ENUM ('hero', 'philosophy', 'current_direction', 'about_header', 'about_intro', 'education', 'work_process', 'outside_engineering');

-- CreateTable
CREATE TABLE "site_chunks" (
    "id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" TEXT[],
    "embedding" vector(1536) NOT NULL,
    "contentHash" TEXT,
    "embeddingModel" TEXT,
    "embeddedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "page" "content_page" NOT NULL,
    "section" "content_section" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "principles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "principles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "lead" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "assistant_prompt" TEXT,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "dates" TEXT NOT NULL,
    "location" TEXT,
    "category" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "future" TEXT,
    "collaboration" TEXT,
    "positioning" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "stacks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "links" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_chunks_source_type_source_id_chunk_index_key" ON "site_chunks"("source_type", "source_id", "chunk_index");

-- CreateIndex
CREATE UNIQUE INDEX "content_blocks_key_key" ON "content_blocks"("key");

-- CreateIndex
CREATE INDEX "content_blocks_page_section_position_idx" ON "content_blocks"("page", "section", "position");

-- CreateIndex
CREATE UNIQUE INDEX "content_blocks_page_section_position_key" ON "content_blocks"("page", "section", "position");

-- CreateIndex
CREATE INDEX "principles_section_position_idx" ON "principles"("section", "position");

-- CreateIndex
CREATE UNIQUE INDEX "principles_section_position_key" ON "principles"("section", "position");

-- CreateIndex
CREATE UNIQUE INDEX "services_position_key" ON "services"("position");

-- CreateIndex
CREATE UNIQUE INDEX "experiences_position_key" ON "experiences"("position");

-- CreateIndex
CREATE UNIQUE INDEX "projects_title_key" ON "projects"("title");

-- CreateIndex
CREATE UNIQUE INDEX "projects_position_key" ON "projects"("position");

-- CreateIndex
CREATE INDEX "projects_featured_position_idx" ON "projects"("featured", "position");
