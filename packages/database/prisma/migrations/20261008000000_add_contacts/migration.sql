-- Store contact-form submissions from the public "Liên hệ" page.
CREATE TABLE "contacts" (
  "id" TEXT NOT NULL,
  "code" VARCHAR(100),
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(50),
  "subject" VARCHAR(150) NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "usercreate_at" VARCHAR(255),
  "userupdated_at" VARCHAR(255),
  "isdelete" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contacts_code_key" ON "contacts"("code");
