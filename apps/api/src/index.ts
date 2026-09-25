// Load .env BEFORE Prisma client initializes (import hoisting would otherwise
// instantiate PrismaClient before DATABASE_URL exists).
import "dotenv/config";

import express from "express";
import cors from "cors";
import { db } from "@career-portal/database";
import { ApplyJobSchema } from "@career-portal/types";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// API: Lấy danh sách jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await db.job.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { posted: "desc" },
    });
    res.json(jobs);
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// API: Nộp hồ sơ ứng tuyển
app.post("/api/jobs/:jobId/apply", async (req, res) => {
  try {
    const validation = ApplyJobSchema.safeParse({
      ...req.body,
      jobId: req.params.jobId,
    });

    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { jobId, name, email, phone, coverLetter } = validation.data;

    const candidate = await db.candidate.create({
      data: {
        code: `CAND-${Date.now()}`,
        jobId,
        name,
        email,
        phone,
        coverLetter,
        resumeUrl: "uploads/sample-resume.pdf",
        formData: {},
        usercreate_at: "candidate_public",
      },
    });

    res.status(201).json({ success: true, candidate });
  } catch (error) {
    console.error("POST apply error:", error);
    res.status(500).json({ error: "Failed to submit application" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
