-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('AVAILABLE', 'SOLD', 'EXPIRED');

-- AlterTable
ALTER TABLE "Find" ADD COLUMN     "availability" "Availability" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "expiresAt" TIMESTAMP(3);
