/*
  Warnings:

  - You are about to drop the column `cancellationPolicy` on the `RatePlan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RatePlan" DROP COLUMN "cancellationPolicy",
ADD COLUMN     "cancellationPolicyId" TEXT;

-- CreateTable
CREATE TABLE "CancellationPolicy" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "freeCancellationHours" INTEGER NOT NULL,
    "refundablePercent" INTEGER NOT NULL,
    "noShowRefundPercent" INTEGER NOT NULL DEFAULT 0,
    "modificationAllowed" BOOLEAN NOT NULL DEFAULT true,
    "modificationFeePercent" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventCategory" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "userId" TEXT,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CancellationPolicy_partnerId_idx" ON "CancellationPolicy"("partnerId");

-- CreateIndex
CREATE INDEX "SystemLog_eventType_createdAt_idx" ON "SystemLog"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_userId_createdAt_idx" ON "SystemLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_eventCategory_createdAt_idx" ON "SystemLog"("eventCategory", "createdAt");

-- AddForeignKey
ALTER TABLE "RatePlan" ADD CONSTRAINT "RatePlan_cancellationPolicyId_fkey" FOREIGN KEY ("cancellationPolicyId") REFERENCES "CancellationPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationPolicy" ADD CONSTRAINT "CancellationPolicy_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
