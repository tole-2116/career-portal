// Load .env BEFORE Prisma client initializes (import hoisting would otherwise
// instantiate PrismaClient before DATABASE_URL exists).
import "dotenv/config";

import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { db } from "@career-portal/database";
import { ApplyJobSchema, ContactSchema } from "@career-portal/types";
import { adminJobsRoutes } from "./routes/admin-jobs.routes";
import { adminCandidateRoutes } from "./routes/admin-candidates.routes";
import { adminUserRoutes } from "./routes/admin-users.routes";
import { adminNewsRoutes } from "./routes/admin-news.routes";
import { adminTaxonomyRoutes } from "./routes/admin-taxonomies.routes";
import { adminFormConfigRoutes } from "./routes/admin-form-config.routes";
import { adminSiteConfigRoutes } from "./routes/admin-site-config.routes";
import { publicJobsRoutes } from "./routes/public-jobs.routes";
import { adminTaxonomyService } from "./services/admin-taxonomy.service";
import { adminFormConfigService } from "./services/admin-form-config.service";
import { adminSiteConfigService } from "./services/admin-site-config.service";
import { newsRoutes } from "./routes/news.routes";
import { authRoutes } from "./routes/auth.routes";
import { uploadCv } from "./middleware/upload";
import multer from "multer";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
app.use(cookieParser());
app.use(express.json());

// Phục vụ ảnh bìa tin tức đã upload (apps/api/uploads).
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API: Jobs công khai (mở) — danh sách job đang tuyển + chi tiết, không cần đăng nhập.
app.use("/api/jobs", publicJobsRoutes);

const applyCvUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadCv.single("cv")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ success: false, error: "CV file must not exceed 5MB" });
      return;
    }
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Invalid CV file",
    });
  });
};

// API: Nộp hồ sơ ứng tuyển
app.post("/api/jobs/:jobId/apply", applyCvUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "CV file is required" });
    }

    let formData: unknown = req.body.formData;
    if (typeof formData === "string") {
      try {
        formData = JSON.parse(formData);
      } catch {
        return res.status(400).json({ success: false, error: "Invalid form data" });
      }
    }

    const validation = ApplyJobSchema.safeParse({
      ...req.body,
      formData,
      jobId: req.params.jobId,
    });

    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { jobId, name, email, phone, address, coverLetter } = validation.data;

    const candidate = await db.candidate.create({
      data: {
        code: `CAND-${Date.now()}`,
        jobId,
        name,
        email,
        phone,
        address: address || null,
        coverLetter,
        cvFile: `/uploads/${req.file.filename}`,
        formData: validation.data.formData ?? {},
        usercreate_at: "candidate_public",
      },
    });

    return res.status(201).json({ success: true, candidate });
  } catch (error) {
    console.error("POST apply error:", error);
    return res.status(500).json({ error: "Failed to submit application" });
  }
});

// API: Liên hệ (mở) — lưu tin nhắn từ biểu mẫu trang Liên hệ.
app.post("/api/contacts", async (req, res) => {
  try {
    const validation = ContactSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { name, email, phone, subject, body } = validation.data;

    const contact = await db.contact.create({
      data: {
        code: `CONTACT-${Date.now()}`,
        name,
        email,
        phone: phone || null,
        subject,
        body,
        usercreate_at: "contact_public",
      },
    });

    return res.status(201).json({ success: true, data: { id: contact.id, code: contact.code } });
  } catch (error) {
    console.error("POST /api/contacts error:", error);
    return res.status(500).json({ success: false, error: "Failed to submit contact message" });
  }
});

// API: Danh mục dùng chung (mở) — phục vụ trang liệt kê việc làm và chi tiết tin tuyển dụng.
app.get("/api/taxonomies", async (_req, res) => {
  try {
    res.json({ success: true, data: await adminTaxonomyService.list() });
  } catch (error) {
    console.error("GET /api/taxonomies error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch taxonomies" });
  }
});

// API: Form configuration (mở) — phục vụ trang ứng tuyển.
app.get("/api/form-config", async (_req, res) => {
  try {
    res.json({ success: true, data: await adminFormConfigService.get() });
  } catch (error) {
    console.error("GET /api/form-config error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch form configuration" });
  }
});

// API: Site configuration (mở) — phục vụ toàn bộ website công khai.
app.get("/api/site-config", async (_req, res) => {
  try {
    res.json({ success: true, data: await adminSiteConfigService.get() });
  } catch (error) {
    console.error("GET /api/site-config error:", error);
    res.status(404).json({ success: false, error: "Site configuration not found" });
  }
});

// API Auth
app.use("/api/auth", authRoutes);

// API Admin: CRUD routes
app.use("/api/admin/jobs", adminJobsRoutes);
app.use("/api/admin/candidates", adminCandidateRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/news", adminNewsRoutes);
app.use("/api/admin/taxonomies", adminTaxonomyRoutes);
app.use("/api/admin/form-config", adminFormConfigRoutes);
app.use("/api/admin/site-config", adminSiteConfigRoutes);

// API public: published news
app.use("/api/news", newsRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
