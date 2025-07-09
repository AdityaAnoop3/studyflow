/*
  Warnings:

  - Added the required column `updatedAt` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Review" 
ADD COLUMN "repetitions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN "interval" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "quality" INTEGER,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
