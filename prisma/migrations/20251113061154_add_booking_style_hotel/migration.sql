/*
  Warnings:

  - Added the required column `city` to the `Hotel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Hotel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Hotel` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "HotelStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "starRating" INTEGER,
ADD COLUMN     "status" "HotelStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
