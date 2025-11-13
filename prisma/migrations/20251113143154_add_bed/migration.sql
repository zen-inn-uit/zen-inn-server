/*
  Warnings:

  - You are about to drop the column `bedCount` on the `Room` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BedType" AS ENUM ('SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'TWIN', 'BUNK');

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "bedCount";

-- CreateTable
CREATE TABLE "Bed" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bedType" "BedType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
