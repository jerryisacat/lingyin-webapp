-- AlterTable: Add missing columns to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "topUpBalanceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenRolloverUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "rolloverCalculated" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "encryptionPasswordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "encryptionSalt" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "writingStyle" JSONB NOT NULL DEFAULT '{"perspective": "first_person", "persona": "yuanshao"}'::jsonb;

-- CreateTable: TokenUsage
CREATE TABLE IF NOT EXISTS "TokenUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TokenUsage_userId_createdAt_idx" ON "TokenUsage"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TokenUsage" ADD CONSTRAINT "TokenUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: TokenTopUp
CREATE TABLE IF NOT EXISTS "TokenTopUp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "priceCny" INTEGER NOT NULL,
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenTopUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TokenTopUp_stripePaymentIntentId_key" ON "TokenTopUp"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TokenTopUp_userId_createdAt_idx" ON "TokenTopUp"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TokenTopUp" ADD CONSTRAINT "TokenTopUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
