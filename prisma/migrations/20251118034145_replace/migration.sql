/*
  Warnings:

  - You are about to drop the `RoomBookingStyle` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."RoomBookingStyle" DROP CONSTRAINT "RoomBookingStyle_roomId_fkey";

-- DropTable
DROP TABLE "public"."RoomBookingStyle";

-- CreateTable
CREATE TABLE "RatePlan" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rateCode" TEXT,
    "basePrice" INTEGER NOT NULL,
    "minLos" INTEGER NOT NULL DEFAULT 1,
    "maxLos" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "cancellationPolicy" TEXT,
    "refundablePercent" INTEGER NOT NULL DEFAULT 100,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositPercent" INTEGER NOT NULL DEFAULT 0,
    "includesBreakfast" BOOLEAN NOT NULL DEFAULT false,
    "includesDinner" BOOLEAN NOT NULL DEFAULT false,
    "includesParking" BOOLEAN NOT NULL DEFAULT false,
    "otherInclusions" TEXT,
    "minGuestCount" INTEGER NOT NULL DEFAULT 1,
    "maxGuestCount" INTEGER,
    "modificationAllowed" BOOLEAN NOT NULL DEFAULT true,
    "modificationFee" INTEGER NOT NULL DEFAULT 0,
    "rateType" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RatePlan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RatePlan" ADD CONSTRAINT "RatePlan_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
