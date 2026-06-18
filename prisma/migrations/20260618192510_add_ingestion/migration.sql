-- AlterTable
ALTER TABLE "Find" ADD COLUMN     "autoIngested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "externalId" TEXT;

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "source" "SourceSite" NOT NULL,
    "query" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "minPrice" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedSearch_active_idx" ON "SavedSearch"("active");

-- CreateIndex
CREATE INDEX "Find_externalId_idx" ON "Find"("externalId");
