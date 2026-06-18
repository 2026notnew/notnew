-- CreateTable
CREATE TABLE "FindRevision" (
    "id" TEXT NOT NULL,
    "findId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "editorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FindRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FindRevision_findId_createdAt_idx" ON "FindRevision"("findId", "createdAt");

-- AddForeignKey
ALTER TABLE "FindRevision" ADD CONSTRAINT "FindRevision_findId_fkey" FOREIGN KEY ("findId") REFERENCES "Find"("id") ON DELETE CASCADE ON UPDATE CASCADE;
