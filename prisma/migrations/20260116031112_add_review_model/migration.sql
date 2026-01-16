-- AlterTable
ALTER TABLE "CancellationPolicy" ADD COLUMN     "hotelId" TEXT;

-- AlterTable
ALTER TABLE "RatePlan" ADD COLUMN     "hotelId" TEXT;

-- CreateTable
CREATE TABLE "RoomInventory" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "available" INTEGER NOT NULL DEFAULT 1,
    "price" INTEGER,
    "isStopSell" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "repliedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomInventory_roomId_date_idx" ON "RoomInventory"("roomId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RoomInventory_roomId_date_key" ON "RoomInventory"("roomId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_hotelId_idx" ON "Review"("hotelId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_bookingId_idx" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- AddForeignKey
ALTER TABLE "RoomInventory" ADD CONSTRAINT "RoomInventory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatePlan" ADD CONSTRAINT "RatePlan_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationPolicy" ADD CONSTRAINT "CancellationPolicy_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
