/*
  Warnings:

  - You are about to drop the column `roomId` on the `RatePlan` table. All the data in the column will be lost.
  - You are about to drop the column `discountPercent` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `originalPrice` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Room` table. All the data in the column will be lost.
  - Added the required column `partnerId` to the `RatePlan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."RatePlan" DROP CONSTRAINT "RatePlan_roomId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "ratePlanId" TEXT;

-- AlterTable
ALTER TABLE "RatePlan" DROP COLUMN "roomId",
ADD COLUMN     "partnerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "discountPercent",
DROP COLUMN "originalPrice",
DROP COLUMN "price",
ADD COLUMN     "cancellationPolicyId" TEXT;

-- CreateTable
CREATE TABLE "_RatePlanToRoom" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RatePlanToRoom_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RatePlanToRoom_B_index" ON "_RatePlanToRoom"("B");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_cancellationPolicyId_fkey" FOREIGN KEY ("cancellationPolicyId") REFERENCES "CancellationPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatePlan" ADD CONSTRAINT "RatePlan_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "RatePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RatePlanToRoom" ADD CONSTRAINT "_RatePlanToRoom_A_fkey" FOREIGN KEY ("A") REFERENCES "RatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RatePlanToRoom" ADD CONSTRAINT "_RatePlanToRoom_B_fkey" FOREIGN KEY ("B") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
