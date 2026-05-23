-- DropTable: Remove BYOK ApiKey table after V1 migration to server-managed keys
DROP TABLE IF EXISTS "ApiKey" CASCADE;
