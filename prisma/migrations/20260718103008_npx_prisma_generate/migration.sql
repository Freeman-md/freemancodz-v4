/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `site_chunks` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "site_chunks_embedding_hnsw_idx";

-- AlterTable
ALTER TABLE "site_chunks" DROP COLUMN "updatedAt",
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
