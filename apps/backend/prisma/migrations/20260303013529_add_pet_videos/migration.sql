-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "videos" TEXT[] DEFAULT ARRAY[]::TEXT[];
