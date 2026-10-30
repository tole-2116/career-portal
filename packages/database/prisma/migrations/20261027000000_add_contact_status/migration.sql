CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'READ', 'RESOLVED');

ALTER TABLE "contacts"
ADD COLUMN "status" "ContactStatus" NOT NULL DEFAULT 'NEW';
