/*
  Warnings:

  - Added the required column `guestCount` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guestEmail` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guestName` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guestPhone` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nightCount` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('SEPAY', 'BANK_TRANSFER', 'CASH');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "guestCount" INTEGER NOT NULL,
ADD COLUMN     "guestEmail" TEXT NOT NULL,
ADD COLUMN     "guestName" TEXT NOT NULL,
ADD COLUMN     "guestPhone" TEXT NOT NULL,
ADD COLUMN     "nightCount" INTEGER NOT NULL,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "specialRequests" TEXT,
ADD COLUMN     "totalPrice" INTEGER NOT NULL,
ADD COLUMN     "transactionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
