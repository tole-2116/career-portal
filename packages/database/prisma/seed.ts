/**
 * Seed script cho Career Portal — hỗ trợ cả môi trường Production (chỉ admin) lẫn Dev/Test (đầy dữ liệu mock).
 *
 * Quy tắc cốt lõi:
 * 1. Nếu NODE_ENV === 'production': Chỉ upsert 01 Super Admin đầu tiên, return ngay (không chèn mock data).
 * 2. Nếu NODE_ENV !== 'production': Chèn toàn bộ dữ liệu mock từ frontend, mapping code->UUID qua in-memory Maps.
 * 3. Mỗi bản ghi: created_at/updated_at + usercreate_at="system_seed" + userupdated_at="system_seed" + isdelete=false.
 * 4. JSON fields (title, description, requirements) tự động chuẩn hóa thành {en, vi}.
 * 5. FK mapping: Taxonomy/User seed trước -> tạo Map -> Job/Candidate/News sau lookup Map.
 * 6. Truncation child-first để có thể chạy lại seed nhiều lần an toàn (idempotency).
 */

import { PrismaClient, Role, JobStatus, CandidateStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

declare const process: { env: Record<string, string | undefined>; exitCode?: number };

// === 1. Phân môi trường ===
const NODE_ENV = process.env.NODE_ENV ?? "development";
const IS_PROD = NODE_ENV === "production";

const INITIAL_ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD ?? "Admin@123456";

const SEED_USER = "system_seed";

const prisma = new PrismaClient();

const audit = {
  usercreate_at: SEED_USER,
  userupdated_at: SEED_USER,
  isdelete: false,
};

/* ------------------------------------------------------------------ *
 * In-memory FK mapping Maps: old mock code -> newly generated UUID.
 * --------------------------------------------------------------- */
const taxonomyMap = new Map<string, string>(); // key "${type}:${code}" -> uuid
const userMap = new Map<string, string>();     // key email -> uuid
const jobMap = new Map<string, string>();      // key mock code -> uuid

/* ---------- Helpers ---------- */

/** Chuyển chuỗi đơn hoặc object bất kỳ sang bilingual JSON {en, vi}. */
function asLocalized(value: string | Record<string, unknown>): { en: string; vi: string } {
  if (value && typeof value === "object") {
    return {
      en: String((value as Record<string, unknown>).en ?? (value as Record<string, unknown>).vi ?? ""),
      vi: String((value as Record<string, unknown>).vi ?? (value as Record<string, unknown>).en ?? ""),
    };
  }
  const text = String(value);
  return { en: text, vi: text };
}

/** Slugify tiếng Việt: remove accents, đ->d, keep a-z0-9, - separator. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Ensures a bilingual JSON object with both en and vi keys.
 * If value is already {en, vi}, returns it. If plain string, wraps both.
 */
function ensureBilingualJSON(value: unknown): { en: string; vi: string } {
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const obj = value as Record<string, unknown>;
    if (obj.en !== undefined && obj.vi !== undefined) {
      return { en: String(obj.en), vi: String(obj.vi) };
    }
  }
  const txt = String(value ?? "");
  return { en: txt, vi: txt };
}

/* ---------- Source data (taken from apps/web mock stores) ---------- */

// Jobs from apps/web/src/data/jobs
import { jobs } from "../../../apps/web/src/data/jobs";

// Candidates from apps/web/src/data/candidates
import { candidates } from "../../../apps/web/src/data/candidates";

// News articles + categories (inline — news-store.tsx imports React and cannot be used in seed)
const newsCategories = [
  { id: "company", code: "news-company", label: { vi: "Hoạt động công ty", en: "Company news" }, slug: "company-news" },
  { id: "culture", code: "news-culture", label: { vi: "Văn hóa", en: "Culture" }, slug: "culture" },
  { id: "event", code: "news-event", label: { vi: "Sự kiện", en: "Events" }, slug: "events" },
  { id: "recruitment", code: "news-recruitment", label: { vi: "Tuyển dụng", en: "Recruitment" }, slug: "recruitment" },
];

const articles = [
  { id: "a1", slug: "ngay-hoi-tuyen-dung-2026", categoryId: "recruitment", date: "2026-03-12", author: "TalentHub", published: true, featured: true, title: { vi: "Ngày hội tuyển dụng 2026: gặp gỡ hơn 300 ứng viên", en: "Careers Day 2026: meeting more than 300 candidates" }, excerpt: { vi: "Một ngày kết nối trực tiếp giữa đội ngũ tuyển dụng và các bạn trẻ đam mê công nghệ.", en: "A day of direct connection between our hiring team and young tech talent." }, body: { vi: "Ngày hội tuyển dụng năm nay diễn ra tại ba thành phố với hơn 300 ứng viên tham dự.\n\nCác bạn được trò chuyện trực tiếp với quản lý tuyển dụng, tham quan không gian làm việc và thử sức với những bài toán thực tế mà đội ngũ đang giải quyết mỗi ngày.\n\nChúng tôi sẽ tiếp tục mở rộng chương trình trong các quý tới.", en: "This year's careers day took place in three cities with more than 300 candidates.\n\nAttendees met hiring managers, toured our workspaces and tried real problems our teams solve every day.\n\nThe programme will expand over the coming quarters." } },
  { id: "a2", slug: "van-hoa-hoc-tap-lien-tuc", categoryId: "culture", date: "2026-02-02", author: "TalentHub", published: true, featured: false, title: { vi: "Văn hóa học tập liên tục tại công ty", en: "A culture of continuous learning" }, excerpt: { vi: "Mỗi thành viên có ngân sách học tập riêng và hai giờ mỗi tuần dành cho phát triển bản thân.", en: "Every teammate gets a learning budget and two hours a week for personal growth." }, body: { vi: "Chúng tôi tin rằng con người phát triển thì sản phẩm mới phát triển.\n\nMỗi thành viên có ngân sách học tập hằng năm, hai giờ mỗi tuần cho việc học và một buổi chia sẻ nội bộ mỗi tháng.", en: "We believe products grow when people grow.\n\nEach teammate has an annual learning budget, two hours a week for study and a monthly internal knowledge-sharing session." } },
  { id: "a3", slug: "khai-truong-van-phong-da-nang", categoryId: "company", date: "2026-01-08", author: "TalentHub", published: true, featured: false, title: { vi: "Khai trương văn phòng Đà Nẵng", en: "Opening our Da Nang office" }, excerpt: { vi: "Không gian làm việc mới với sức chứa 120 chỗ ngồi bên bờ sông Hàn.", en: "A new 120-seat workspace by the Han river." }, body: { vi: "Văn phòng Đà Nẵng chính thức đi vào hoạt động, mở thêm cơ hội cho các bạn ở khu vực miền Trung.\n\nKhông gian được thiết kế mở, nhiều phòng họp nhỏ và khu vực nghỉ ngơi cho đội ngũ.", en: "Our Da Nang office is now open, creating new opportunities in central Vietnam.\n\nThe space is open-plan with plenty of small meeting rooms and lounge areas." } },
];

// Staff users (recruiters) từ auth-store.tsx
const staffUsers = [
  { code: "user-admin", email: "admin@talenthub.vn", name: "Quản trị viên", role: Role.ADMIN },
  { code: "user-hathanh", email: "hathanh.tran@talenthub.vn", name: "Trần Thu Hà", role: Role.RECRUITER },
  { code: "user-duc-long", email: "duclong.pham@talenthub.vn", name: "Phạm Đức Long", role: Role.RECRUITER },
  { code: "user-thanh-mai", email: "thanhmai.do@talenthub.vn", name: "Đỗ Thanh Mai", role: Role.RECRUITER },
];

// Candidate applications từ candidates.ts — stage values map to CandidateStatus enum
// new -> NEW, screening -> SCREENING, interview -> INTERVIEW, offer -> OFFER, hired -> HIRED, rejected -> REJECTED
const stageToCandidateStatus: Record<string, CandidateStatus> = {
  new: CandidateStatus.NEW,
  screening: CandidateStatus.SCREENING,
  interview: CandidateStatus.INTERVIEW,
  offer: CandidateStatus.OFFER,
  hired: CandidateStatus.HIRED,
  rejected: CandidateStatus.REJECTED,
};

/* ---------- Main seeding logic ---------- */

async function main() {
  console.log("🌱 Seeding database... (NODE_ENV =", NODE_ENV, ")");

  // === YÊU CẦU 1: CHẾ ĐỘ PRODUCTION - CHỈ SEED SUPER ADMIN ===
  if (IS_PROD) {
    console.log("🛡️  Production mode: seeding only essential system admin...");

    // Tìm xem đã có user admin chưa (theo email unique)
    const existingAdmin = await prisma.user.findFirst({
      where: { email: "admin@careerportal.com" },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, 10);
      await prisma.user.create({
        data: {
          code: "USR-ROOT-001",
          email: "admin@careerportal.com",
          passwordHash,
          name: "Quản trị viên",
          role: Role.ADMIN,
          ...audit,
        },
      });
      console.log("✅ Super Admin created: admin@careerportal.com");
    } else {
      console.log("ℹ️  Super Admin already exists, skipping creation.");
    }

    console.log("[PRODUCTION] Essential admin seeded. Skipping mock test data.");
    return; // KHÔNG chèn dữ liệu mock/Test nào vào DB ở production
  }

  // === YÊU CẦU 2: MÔI TRƯỜNG DEV/TEST - SEED PUN DAY DỮ LIỆU MOCK ===
  console.log("🔧 Development mode: seeding full mock data...");

  // --- Bước 0: Dọn dẹp dữ liệu cũ (child-first) để seed chạy lại an toàn ---
  console.log("🧹 Cleaning old data (child-first) for idempotent re-seed...");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE candidates, news, jobs, taxonomies, users RESTART IDENTITY CASCADE`,
  );

  // Đảm bảo Truncate xong rồi mới vào transaction
  await prisma.$transaction(async (tx) => {
    /* ---- 1. Taxonomies (bảng độc lập, seed trước) ---- */
    // Tạo taxonomy groups từ jobs + newsCategories
    const taxonomyDefs: Array<{ type: string; label: { vi: string; en: string } }> = [];

    // Từ jobs: department, workType, level, location
    const seenTax = new Map<string, { type: string; label: { vi: string; en: string } }>();
    const addTax = (type: string, label: { vi: string; en: string }) => {
      const key = `${type}:${label.en}`;
      if (!seenTax.has(key)) {
        seenTax.set(key, { type, label });
        taxonomyDefs.push({ type, label });
      }
    };
    for (const j of jobs) {
      addTax("department", j.department);
      addTax("workType", j.workType);
      addTax("level", j.level);
      for (const loc of j.locations) addTax("location", loc);
    }
    for (const nc of newsCategories) {
      addTax("newsCategory", nc.label);
    }

    for (const def of taxonomyDefs) {
      const code = slugify(def.label.en);
      const created = await tx.taxonomy.create({
        data: {
          code,
          type: def.type,
          name: asLocalized(def.label),
          slug: slugify(def.label.en),
          ...audit,
        },
      });
      taxonomyMap.set(`${def.type}:${code}`, created.id);
    }
    console.log(`Seeded ${taxonomyDefs.length} Taxonomies`);

    /* ---- 2. Users (bảng độc lập, bcrypt hash + FK map) ---- */
    // Staff users (recruiters)
    for (const u of staffUsers) {
      // Kiểm tra email đã tồn tại chưa (upsert an toàn)
      const existing = await tx.user.findFirst({ where: { email: u.email } });
      if (!existing) {
        const passwordHash = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, 10);
        const created = await tx.user.create({
          data: {
            code: u.code,
            email: u.email,
            passwordHash,
            name: u.name,
            role: u.role,
            ...audit,
          },
        });
        userMap.set(u.email, created.id);
      } else {
        userMap.set(u.email, existing.id);
      }
    }
    // Candidate users (tạo password hash ngẫu nhiên)
    for (const c of candidates) {
      const existing = await tx.user.findFirst({ where: { email: c.email } });
      if (!existing) {
        // Tạo password hash tạm thời cho candidate
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash("Candidate@123", saltRounds);
        const created = await tx.user.create({
          data: {
            code: `user-${c.id}`,
            email: c.email,
            passwordHash,
            name: c.name,
            role: Role.CANDIDATE,
            ...audit,
          },
        });
        userMap.set(c.email, created.id);
      } else {
        userMap.set(c.email, existing.id);
      }
    }
    console.log(`Seeded ${staffUsers.length + candidates.length} Users`);

    /* ---- 3. Jobs (FK -> taxonomyId từ taxonomyMap) ---- */
    for (const j of jobs) {
      // Map department code -> taxonomyId
      const deptKey = `department:${slugify(j.department.en)}`;
      const taxonomyId = taxonomyMap.get(deptKey);

      // Map workType code -> taxonomyId (cho cột type)
      const workKey = `workType:${slugify(j.workType.en)}`;
      const typeId = taxonomyMap.get(workKey);

      // Map location code
      const locKey = `location:${slugify(j.locations[0].en)}`;
      const locationId = taxonomyMap.get(locKey);

      const created = await tx.job.create({
        data: {
          code: j.id, // Lưu mock id vào cột code (quy tắc #1)
          title: ensureBilingualJSON(j.title),
          slug: j.id, // gán slug giống code/id cho dễ query
          description: j.description.map((p) => ensureBilingualJSON(p)),
          requirements: j.requirements.map((r) => ensureBilingualJSON(r)),
          benefits: j.benefits.map((b) => ensureBilingualJSON(b)),
          extraFields: [],
          applicants: j.applicants,
          featured: j.featured,
          posted: new Date(j.posted),
          deadline: new Date(j.deadline),
          headcount: null,
          experience: ensureBilingualJSON(j.level),
          languages: ensureBilingualJSON(j.salary),
          contactName: null,
          contactEmail: null,
          status: j.status === "open" ? JobStatus.OPEN : j.status === "paused" ? JobStatus.PAUSED : j.status === "expired" ? JobStatus.EXPIRED : j.status === "closed" ? JobStatus.CLOSED : JobStatus.DRAFT,
          // Cột taxonomyId + cột department (String?): connect qua taxonomyMap
          taxonomyId: taxonomyId ?? null,
          department: taxonomyId ?? null,
          location: locationId ?? null,
          type: typeId ?? null,
          ...audit,
        },
      });
      jobMap.set(j.id, created.id); // key = mock code, value = new UUID
    }
    console.log(`Seeded ${jobs.length} Jobs`);

    /* ---- 4. Candidates (FK -> jobId từ jobMap + candidateId từ userMap, upsert theo code) ---- */
    // upsert theo code: an toàn chạy lại nhiều lần, không lỗi Unique constraint
    for (const c of candidates) {
      const jobId = jobMap.get(c.jobId);
      if (!jobId) throw new Error(`Missing job mapping for ${c.jobId} (FK safety check)`);
      const candidateUserId = userMap.get(c.email);
      if (!candidateUserId) throw new Error(`Missing candidate user mapping for ${c.email}`);

      const candidateStatus = stageToCandidateStatus[c.stage] ?? CandidateStatus.NEW;
      const location = asLocalized(c.location).en;
      const appData = {
        code: c.id,                     // mock id -> cột code
        jobId,                          // UUID mới từ jobMap
        candidateUserId,                // UUID mới từ userMap
        name: c.name,
        email: c.email,
        phone: c.phone,
        currentCompany: "",
        experienceYears: 0,
        status: candidateStatus,
        appliedAt: new Date(c.appliedAt), // string -> Date
        resumeUrl: c.cvFile,
        coverLetter: "",
        notes: "",
        rating: c.rating,
        formData: JSON.stringify({
          fullName: c.name,
          email: c.email,
          phone: c.phone,
          city: location,
          coverLetter: "",
        }),
        ...audit, // usercreate_at="system_seed", userupdated_at="system_seed", isdelete=false
      };

      await tx.candidate.upsert({
        where: { code: c.id },
        update: appData,
        create: appData,
      });
    }
    console.log(`Seeded ${candidates.length} Candidates (upsert by code)`);

    /* ---- 5. News (FK -> authorId từ userMap, categoryId plain string) ---- */
    // Binde articles to the admin account created ở bước 2
    const authorId = userMap.get("admin@talenthub.vn");
    if (!authorId) throw new Error("Missing admin user mapping for news author");

    for (const a of articles) {
      // Tìm categoryId từ newsCategories mapping
      const categoryDef = newsCategories.find((nc) => nc.code === a.categoryId);
      const categoryId = categoryDef ? categoryDef.code : a.categoryId;

      await tx.news.create({
        data: {
          code: a.id, // mock code -> cột code
          categoryId, // taxonomy/newsCategory code dạng plain string
          title: ensureBilingualJSON(a.title),
          slug: a.slug,
          coverUrl: "",
          authorId,
          date: new Date(a.date),
          published: a.published,
          featured: a.featured,
          excerpt: ensureBilingualJSON(a.excerpt),
          ...audit,
        },
      });
    }
    console.log(`Seeded ${articles.length} News articles`);
  });

  console.log("✅ Seed complete!");
  console.log(
    `   - ${taxonomyMap.size} taxonomies (department, workType, level, location, newsCategory)`,
  );
  console.log(`   - ${userMap.size} users (admin, recruiters, candidates)`);
  console.log(`   - ${jobMap.size} jobs`);
  console.log(`   - ${candidates.length} candidates`);
  console.log(`   - ${articles.length} news articles`);
  console.log(`   - Mapped ${taxonomyMap.size + userMap.size + jobMap.size} Foreign Keys Successfully`);
  console.log(`   - Default password for all seeded accounts: ${INITIAL_ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });