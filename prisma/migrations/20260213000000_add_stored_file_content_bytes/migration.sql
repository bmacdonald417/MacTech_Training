-- Add optional contentBytes to StoredFile for DB-backed storage when disk is not writable
ALTER TABLE "StoredFile" ADD COLUMN IF NOT EXISTS "contentBytes" BYTEA;
