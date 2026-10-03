-- Preserve legacy text notes while converting the column to JSONB note history.
ALTER TABLE "candidates"
  ALTER COLUMN "notes" DROP DEFAULT,
  ALTER COLUMN "notes" TYPE JSONB
  USING CASE
    WHEN "notes" IS NULL OR btrim("notes") = '' THEN '[]'::jsonb
    ELSE jsonb_build_array(
      jsonb_build_object(
        'author', '',
        'at', '',
        'body', jsonb_build_object('vi', "notes", 'en', "notes")
      )
    )
  END,
  ALTER COLUMN "notes" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "notes" SET NOT NULL;
