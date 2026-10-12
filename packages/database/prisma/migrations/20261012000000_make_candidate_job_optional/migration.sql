-- Cho phép ứng viên không gắn tin tuyển dụng (hồ sơ tự do): jobId nullable.
-- DropForeignKey
ALTER TABLE "candidates" DROP CONSTRAINT "candidates_jobId_fkey";

-- AlterTable
ALTER TABLE "candidates" ALTER COLUMN "jobId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
