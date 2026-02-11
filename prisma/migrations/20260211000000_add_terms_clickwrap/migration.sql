-- CreateTable: TermsVersion (clickwrap / terms of service versions)
CREATE TABLE "TermsVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermsVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TermsVersion_version_key" ON "TermsVersion"("version");
CREATE INDEX "TermsVersion_isActive_idx" ON "TermsVersion"("isActive");

-- CreateTable: UserTermsAcceptance (audit of terms acceptance)
CREATE TABLE "UserTermsAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "termsVersionId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "acceptanceContext" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTermsAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserTermsAcceptance_userId_idx" ON "UserTermsAcceptance"("userId");
CREATE INDEX "UserTermsAcceptance_termsVersionId_idx" ON "UserTermsAcceptance"("termsVersionId");
CREATE INDEX "UserTermsAcceptance_userId_termsVersionId_idx" ON "UserTermsAcceptance"("userId", "termsVersionId");

-- Add TERMS_ACCEPTED to EventType enum (PostgreSQL)
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'TERMS_ACCEPTED';

-- Foreign keys
ALTER TABLE "UserTermsAcceptance" ADD CONSTRAINT "UserTermsAcceptance_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTermsAcceptance" ADD CONSTRAINT "UserTermsAcceptance_termsVersionId_fkey"
    FOREIGN KEY ("termsVersionId") REFERENCES "TermsVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
