-- Make cvFile nullable and add Candidate experience taxonomy relation.
ALTER TABLE "candidates" ALTER COLUMN "cvFile" DROP NOT NULL;
ALTER TABLE "candidates" ADD COLUMN "experienceId" TEXT;

CREATE INDEX "candidates_experienceId_idx" ON "candidates"("experienceId");

ALTER TABLE "candidates" ADD CONSTRAINT "candidates_experienceId_fkey"
  FOREIGN KEY ("experienceId") REFERENCES "taxonomies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
