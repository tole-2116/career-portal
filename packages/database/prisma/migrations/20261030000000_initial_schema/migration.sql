-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECRUITER', 'CANDIDATE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'OPEN', 'PAUSED', 'EXPIRED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'READ', 'RESOLVED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CANDIDATE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "usercreate_at" VARCHAR(255),
    "userupdated_at" VARCHAR(255),
    "isdelete" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" VARCHAR(500),
    "ipAddress" VARCHAR(45),
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxonomies" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "type" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "usercreate_at" VARCHAR(255),
    "userupdated_at" VARCHAR(255),
    "isdelete" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "taxonomies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100),
    "title" JSONB NOT NULL,
    "summary" JSONB,
    "slug" TEXT NOT NULL,
    "description" JSONB,
    "requirements" JSONB,
    "benefits" JSONB,
    "extraFields" JSONB NOT NULL DEFAULT '[]',
    "applicants" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "posted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "headcount" INTEGER,
    "experienceId" TEXT,
    "experience" JSONB,
    "languages" JSONB,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "departmentId" VARCHAR(100),
    "locationIds" VARCHAR(500),
    "workTypeId" VARCHAR(100),
    "salaryId" VARCHAR(100),
    "level" JSONB,
    "taxonomyId" VARCHAR(100),
    "usercreate_at" VARCHAR(255),
    "userupdated_at" VARCHAR(255),
    "isdelete" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "subject" VARCHAR(150) NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "usercreate_at" VARCHAR(255),
    "userupdated_at" VARCHAR(255),
    "isdelete" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "jobId" TEXT,
    "candidateUserId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "address" VARCHAR(500),
    "currentCompany" VARCHAR(255),
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "status" "CandidateStatus" NOT NULL DEFAULT 'NEW',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cvFile" TEXT,
    "experienceId" TEXT,
    "coverLetter" TEXT,
    "highlights" JSONB NOT NULL DEFAULT '[]',
    "notes" JSONB NOT NULL DEFAULT '[]',
    "rating" INTEGER DEFAULT 0,
    "formData" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "usercreate_at" VARCHAR(255),
    "userupdated_at" VARCHAR(255),
    "isdelete" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100),
    "categoryId" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "slug" TEXT NOT NULL,
    "coverUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "excerpt" JSONB NOT NULL DEFAULT '{}',
    "body" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "usercreate_at" VARCHAR(255),
    "userupdated_at" VARCHAR(255),
    "isdelete" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_configs" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100),
    "name" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "submitLabel" JSONB NOT NULL,
    "successTitle" JSONB NOT NULL,
    "successBody" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "usercreate_at" VARCHAR(255),
    "userupdated_at" VARCHAR(255),
    "isdelete" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "form_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_configs" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(100),
    "layout" TEXT NOT NULL,
    "paletteId" TEXT NOT NULL,
    "primary" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "surfaceTone" TEXT NOT NULL,
    "images" JSONB NOT NULL,
    "copy" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "company" JSONB NOT NULL,
    "about" JSONB NOT NULL,
    "jobsPage" JSONB NOT NULL,
    "modules" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "usercreate_at" VARCHAR(255),
    "userupdated_at" VARCHAR(255),
    "isdelete" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "site_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_code_key" ON "users"("code");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
CREATE INDEX "refresh_tokens_userId_revokedAt_idx" ON "refresh_tokens"("userId", "revokedAt");
CREATE UNIQUE INDEX "taxonomies_code_key" ON "taxonomies"("code");
CREATE UNIQUE INDEX "taxonomies_slug_key" ON "taxonomies"("slug");
CREATE INDEX "taxonomies_type_idx" ON "taxonomies"("type");
CREATE UNIQUE INDEX "jobs_code_key" ON "jobs"("code");
CREATE UNIQUE INDEX "jobs_slug_key" ON "jobs"("slug");
CREATE INDEX "jobs_salaryId_idx" ON "jobs"("salaryId");
CREATE INDEX "jobs_experienceId_idx" ON "jobs"("experienceId");
CREATE UNIQUE INDEX "contacts_code_key" ON "contacts"("code");
CREATE UNIQUE INDEX "candidates_code_key" ON "candidates"("code");
CREATE INDEX "candidates_jobId_idx" ON "candidates"("jobId");
CREATE INDEX "candidates_experienceId_idx" ON "candidates"("experienceId");
CREATE INDEX "candidates_email_idx" ON "candidates"("email");
CREATE INDEX "candidates_status_idx" ON "candidates"("status");
CREATE UNIQUE INDEX "news_code_key" ON "news"("code");
CREATE UNIQUE INDEX "news_slug_key" ON "news"("slug");
CREATE UNIQUE INDEX "form_configs_code_key" ON "form_configs"("code");
CREATE UNIQUE INDEX "site_configs_code_key" ON "site_configs"("code");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_taxonomyId_fkey" FOREIGN KEY ("taxonomyId") REFERENCES "taxonomies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "taxonomies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_workTypeId_fkey" FOREIGN KEY ("workTypeId") REFERENCES "taxonomies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "taxonomies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "taxonomies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "taxonomies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "news" ADD CONSTRAINT "news_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
