ALTER TABLE "candidates" ADD COLUMN "hiredAt" TIMESTAMP(3);
CREATE INDEX "candidates_hiredAt_idx" ON "candidates"("hiredAt");
