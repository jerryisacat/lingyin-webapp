-- AlterTable
ALTER TABLE "User" ADD COLUMN "hasCompletedSetup" BOOLEAN NOT NULL DEFAULT false;

-- Set existing users as having completed setup (they registered before this feature existed)
UPDATE "User" SET "hasCompletedSetup" = true;
