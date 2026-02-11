-- CreateTable: StoredFile (for uploaded PPTX and other stored files)
CREATE TABLE IF NOT EXISTS "StoredFile" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByMembershipId" TEXT,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- Add SlideDeck.sourceFileId (nullable FK to StoredFile)
ALTER TABLE "SlideDeck" ADD COLUMN IF NOT EXISTS "sourceFileId" TEXT;

-- Add Slide.sourceFileId if not present
ALTER TABLE "Slide" ADD COLUMN IF NOT EXISTS "sourceFileId" TEXT;

-- CreateIndex for StoredFile.orgId
CREATE INDEX IF NOT EXISTS "StoredFile_orgId_idx" ON "StoredFile"("orgId");

-- Foreign keys (only add if they don't exist; Prisma may have created StoredFile with FKs already)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'StoredFile_orgId_fkey'
    ) THEN
        ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_orgId_fkey"
            FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SlideDeck_sourceFileId_fkey'
    ) THEN
        ALTER TABLE "SlideDeck" ADD CONSTRAINT "SlideDeck_sourceFileId_fkey"
            FOREIGN KEY ("sourceFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Slide_sourceFileId_fkey'
    ) THEN
        ALTER TABLE "Slide" ADD CONSTRAINT "Slide_sourceFileId_fkey"
            FOREIGN KEY ("sourceFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
