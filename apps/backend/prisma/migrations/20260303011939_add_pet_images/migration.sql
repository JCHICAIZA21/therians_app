-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
