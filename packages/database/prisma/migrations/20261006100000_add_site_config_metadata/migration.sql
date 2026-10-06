-- Align site_configs with Candidate's standard metadata columns.
-- Preserve existing rows while making audit fields safe for new records.

ALTER TABLE "site_configs"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS "code" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "usercreate_at" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "userupdated_at" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "isdelete" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "site_configs_code_key"
  ON "site_configs"("code");
