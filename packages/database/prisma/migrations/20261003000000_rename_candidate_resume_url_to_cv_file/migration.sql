-- Preserve existing candidate CV values while aligning the database column with the Prisma model.
ALTER TABLE "candidates" RENAME COLUMN "resumeUrl" TO "cvFile";
