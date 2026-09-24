import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Taxonomy items (from taxonomy-store.tsx)
const taxonomyData = [
  {
    type: "departments",
    name: { vi: "Ngành nghề", en: "Industries" },
    slug: "departments",
    items: [
      { id: "engineering", label: { vi: "Công nghệ", en: "Engineering" } },
      { id: "design", label: { vi: "Thiết kế", en: "Design" } },
      { id: "people", label: { vi: "Nhân sự", en: "People" } },
      { id: "sales", label: { vi: "Kinh doanh", en: "Sales" } },
      { id: "marketing", label: { vi: "Marketing", en: "Marketing" } },
      { id: "operations", label: { vi: "Vận hành", en: "Operations" } },
    ],
  },
  {
    type: "workTypes",
    name: { vi: "Hình thức làm việc", en: "Work types" },
    slug: "work-types",
    items: [
      { id: "full-time", label: { vi: "Toàn thời gian", en: "Full-time" } },
      { id: "part-time", label: { vi: "Bán thời gian", en: "Part-time" } },
      { id: "hybrid", label: { vi: "Kết hợp từ xa", en: "Hybrid" } },
      { id: "remote", label: { vi: "Làm việc từ xa", en: "Remote" } },
      { id: "internship", label: { vi: "Thực tập", en: "Internship" } },
      { id: "contract", label: { vi: "Hợp đồng thời vụ", en: "Contract" } },
    ],
  },
  {
    type: "salaries",
    name: { vi: "Mức lương", en: "Salary ranges" },
    slug: "salaries",
    items: [
      { id: "negotiable", label: { vi: "Thỏa thuận", en: "Negotiable" } },
      { id: "s-10-15", label: { vi: "10 – 15 triệu VNĐ", en: "10 – 15M VND" } },
      { id: "s-15-25", label: { vi: "15 – 25 triệu VNĐ", en: "15 – 25M VND" } },
      { id: "s-25-40", label: { vi: "25 – 40 triệu VNĐ", en: "25 – 40M VND" } },
      { id: "s-40-60", label: { vi: "40 – 60 triệu VNĐ", en: "40 – 60M VND" } },
      { id: "s-60-plus", label: { vi: "Trên 60 triệu VNĐ", en: "Above 60M VND" } },
    ],
  },
  {
    type: "experiences",
    name: { vi: "Kinh nghiệm", en: "Experience levels" },
    slug: "experiences",
    items: [
      { id: "none", label: { vi: "Chưa yêu cầu kinh nghiệm", en: "No experience required" } },
      { id: "under-1", label: { vi: "Dưới 1 năm", en: "Less than 1 year" } },
      { id: "1-3", label: { vi: "1 – 3 năm", en: "1 – 3 years" } },
      { id: "3-5", label: { vi: "3 – 5 năm", en: "3 – 5 years" } },
      { id: "over-5", label: { vi: "Trên 5 năm", en: "More than 5 years" } },
    ],
  },
  {
    type: "locations",
    name: { vi: "Nơi làm việc", en: "Work locations" },
    slug: "locations",
    items: [
      { id: "hanoi", label: { vi: "Hà Nội", en: "Hanoi" } },
      { id: "hcmc", label: { vi: "TP. Hồ Chí Minh", en: "Ho Chi Minh City" } },
      { id: "danang", label: { vi: "Đà Nẵng", en: "Da Nang" } },
      { id: "remote-vn", label: { vi: "Toàn quốc / Từ xa", en: "Nationwide / Remote" } },
    ],
  },
];

// Job status mapping from app to DB
function mapJobStatus(status: string) {
  const map: Record<string, string> = {
    draft: "DRAFT",
    open: "PUBLISHED",
    paused: "PUBLISHED",
    closed: "CLOSED",
  };
  return map[status] || "PUBLISHED";
}

// Candidate stage mapping
function mapApplicationStage(stage: string) {
  const map: Record<string, string> = {
    new: "APPLIED",
    screening: "REVIEWING",
    interview: "INTERVIEW",
    offer: "OFFERED",
    hired: "OFFERED",
    rejected: "REJECTED",
  };
  return map[stage] || "APPLIED";
}

// Jobs seed data (from jobs.ts)
const jobsData = [
  {
    code: "JOB-001",
    id: "senior-frontend-engineer",
    title: { vi: "Kỹ sư Frontend cấp cao", en: "Senior Frontend Engineer" },
    slug: "senior-frontend-engineer",
    description: {
      vi: "Bạn sẽ làm việc cùng đội thiết kế và sản phẩm để biến ý tưởng thành giao diện chạy thật, nhanh và dễ dùng trên mọi thiết bị. Bạn chịu trách nhiệm về hệ thống thành phần dùng chung, hiệu năng tải trang và trải nghiệm của người dùng cuối.",
      en: "You will work with design and product to turn ideas into real interfaces that are fast and usable on every device. You will own the shared component system, page performance and the end-user experience.",
    },
    requirements: {
      vi: "Tối thiểu 4 năm kinh nghiệm với React và TypeScript; Hiểu sâu về hiệu năng trình duyệt và khả năng tiếp cận; Kinh nghiệm xây dựng hệ thống thiết kế dùng chung; Giao tiếp tốt bằng tiếng Việt và tiếng Anh",
      en: "At least 4 years with React and TypeScript; Strong grasp of browser performance and accessibility; Experience building a shared design system; Comfortable communicating in Vietnamese and English",
    },
    benefits: {
      vi: "Lương tháng 13 và thưởng hiệu suất theo quý; Bảo hiểm sức khỏe cho bản thân và người thân; Làm việc linh hoạt 2 ngày/tuần tại nhà",
      en: "13th month salary and quarterly performance bonus; Health insurance for you and your family; Two remote days every week",
    },
    extraFields: {
      fields: [
        {
          id: "github",
          label: { vi: "Liên kết GitHub / GitLab", en: "GitHub / GitLab link" },
          type: "url",
          required: true,
        },
        {
          id: "stack",
          label: { vi: "Công nghệ bạn thành thạo nhất", en: "Technologies you know best" },
          type: "text",
          required: true,
        },
        {
          id: "experience",
          label: { vi: "Số năm kinh nghiệm", en: "Years of experience" },
          type: "select",
          required: true,
        },
        {
          id: "availability",
          label: { vi: "Thời gian có thể nhận việc", en: "Earliest start date" },
          type: "select",
          required: true,
        },
      ],
    },
    posted: new Date("2026-08-28"),
    deadline: new Date("2026-10-15"),
    status: "PUBLISHED",
    applicants: 42,
    featured: true,
    department: "engineering",
    location: "hanoi",
    type: "full-time",
    experienceId: "over-5",
  },
  {
    code: "JOB-002",
    id: "product-designer",
    title: { vi: "Chuyên viên Thiết kế Sản phẩm", en: "Product Designer" },
    slug: "product-designer",
    description: {
      vi: "Bạn tham gia từ giai đoạn nghiên cứu người dùng đến bàn giao giao diện chi tiết cho đội phát triển.",
      en: "You join from user research all the way to detailed hand-off with the engineering team.",
    },
    requirements: {
      vi: "3 năm kinh nghiệm thiết kế sản phẩm số; Portfolio thể hiện tư duy giải quyết vấn đề; Thành thạo Figma và nguyên tắc hệ thống thiết kế",
      en: "3 years designing digital products; A portfolio that shows problem-solving; Fluent in Figma and design system principles",
    },
    benefits: {
      vi: "Ngân sách học tập 20 triệu mỗi năm; Thiết bị làm việc theo lựa chọn của bạn",
      en: "Annual learning budget of 20M VND; Your choice of work equipment",
    },
    extraFields: {
      fields: [
        {
          id: "portfolio",
          label: { vi: "Liên kết portfolio", en: "Portfolio link" },
          type: "url",
          required: true,
        },
        {
          id: "tools",
          label: { vi: "Công cụ thiết kế sử dụng", en: "Design tools you use" },
          type: "text",
          required: true,
        },
      ],
    },
    posted: new Date("2026-09-02"),
    deadline: new Date("2026-10-10"),
    status: "PUBLISHED",
    applicants: 27,
    featured: true,
    department: "design",
    location: "hcmc",
    type: "full-time",
    experienceId: "3-5",
  },
  {
    code: "JOB-003",
    id: "hr-business-partner",
    title: { vi: "Đối tác Nhân sự", en: "HR Business Partner" },
    slug: "hr-business-partner",
    description: {
      vi: "Bạn là cầu nối giữa chiến lược nhân sự và nhu cầu thực tế của từng bộ phận kinh doanh.",
      en: "You bridge people strategy and the day-to-day needs of each business unit.",
    },
    requirements: {
      vi: "5 năm kinh nghiệm nhân sự tại doanh nghiệp trên 200 người; Kinh nghiệm xây dựng khung năng lực và lộ trình thăng tiến",
      en: "5 years in HR at companies of 200+ people; Experience building competency frameworks and career paths",
    },
    benefits: {
      vi: "Chế độ nghỉ phép 18 ngày/năm; Khám sức khỏe định kỳ hằng năm",
      en: "18 days of annual leave; Annual health check-up",
    },
    extraFields: { fields: [] },
    posted: new Date("2026-08-20"),
    deadline: new Date("2026-09-30"),
    status: "PUBLISHED",
    applicants: 18,
    featured: true,
    department: "people",
    location: "hanoi",
    type: "full-time",
    experienceId: "over-5",
  },
  {
    code: "JOB-004",
    id: "enterprise-account-executive",
    title: { vi: "Chuyên viên Kinh doanh Doanh nghiệp", en: "Enterprise Account Executive" },
    slug: "enterprise-account-executive",
    description: {
      vi: "Bạn sở hữu toàn bộ chu trình bán hàng, từ tiếp cận đến ký kết và mở rộng hợp đồng.",
      en: "You own the full sales cycle, from first contact to signature and expansion.",
    },
    requirements: {
      vi: "3 năm bán giải pháp phần mềm cho doanh nghiệp; Kỹ năng đàm phán và trình bày trước lãnh đạo cấp cao",
      en: "3 years selling software solutions to businesses; Negotiation and executive presentation skills",
    },
    benefits: {
      vi: "Hoa hồng không giới hạn; Chuyến đi thưởng cho nhóm đạt chỉ tiêu",
      en: "Uncapped commission; Annual incentive trip for top performers",
    },
    extraFields: {
      fields: [
        {
          id: "quota",
          label: { vi: "Doanh số cao nhất từng đạt (VNĐ/năm)", en: "Highest annual quota achieved (VND)" },
          type: "text",
          required: true,
        },
        {
          id: "segment",
          label: { vi: "Phân khúc khách hàng quen thuộc", en: "Customer segment you know best" },
          type: "select",
          required: true,
        },
      ],
    },
    posted: new Date("2026-09-05"),
    deadline: new Date("2026-10-20"),
    status: "PUBLISHED",
    applicants: 33,
    featured: false,
    department: "sales",
    location: "hcmc",
    type: "full-time",
    experienceId: "3-5",
  },
  {
    code: "JOB-005",
    id: "data-analyst",
    title: { vi: "Chuyên viên Phân tích Dữ liệu", en: "Data Analyst" },
    slug: "data-analyst",
    description: {
      vi: "Bạn xây dựng báo cáo, theo dõi chỉ số và trả lời các câu hỏi kinh doanh bằng dữ liệu.",
      en: "You build reports, track metrics and answer business questions with data.",
    },
    requirements: {
      vi: "Thành thạo SQL và một công cụ trực quan hóa; Tư duy phản biện với số liệu",
      en: "Strong SQL plus one visualisation tool; Critical thinking about numbers",
    },
    benefits: {
      vi: "Hỗ trợ chi phí làm việc từ xa; Cố vấn 1-1 hằng tháng",
      en: "Remote work stipend; Monthly one-on-one mentoring",
    },
    extraFields: {
      fields: [
        {
          id: "github",
          label: { vi: "Liên kết GitHub / GitLab", en: "GitHub / GitLab link" },
          type: "url",
          required: true,
        },
        {
          id: "stack",
          label: { vi: "Công nghệ bạn thành thạo nhất", en: "Technologies you know best" },
          type: "text",
          required: true,
        },
      ],
    },
    posted: new Date("2026-08-15"),
    deadline: new Date("2026-09-28"),
    status: "PUBLISHED",
    applicants: 51,
    featured: false,
    department: "engineering",
    location: "danang",
    type: "hybrid",
    experienceId: "1-3",
  },
  {
    code: "JOB-006",
    id: "marketing-lead",
    title: { vi: "Trưởng nhóm Marketing", en: "Marketing Lead" },
    slug: "marketing-lead",
    description: {
      vi: "Bạn quản lý một nhóm bốn người và ngân sách truyền thông hằng quý.",
      en: "You manage a team of four and the quarterly marketing budget.",
    },
    requirements: {
      vi: "5 năm kinh nghiệm marketing, ít nhất 2 năm quản lý",
      en: "5 years in marketing, at least 2 leading a team",
    },
    benefits: {
      vi: "Thưởng theo kết quả tăng trưởng",
      en: "Growth-based bonus",
    },
    extraFields: { fields: [] },
    posted: new Date("2026-07-30"),
    deadline: new Date("2026-09-15"),
    status: "CLOSED",
    applicants: 64,
    featured: false,
    department: "marketing",
    location: "hanoi",
    type: "hybrid",
    experienceId: "over-5",
  },
  {
    code: "JOB-007",
    id: "customer-success-specialist",
    title: { vi: "Chuyên viên Chăm sóc Khách hàng", en: "Customer Success Specialist" },
    slug: "customer-success-specialist",
    description: {
      vi: "Bạn hướng dẫn khách hàng sử dụng sản phẩm, xử lý vướng mắc và thu thập phản hồi.",
      en: "You onboard customers, resolve issues and collect feedback for the product team.",
    },
    requirements: {
      vi: "Kỹ năng giao tiếp và viết tốt; Kiên nhẫn và chú ý đến chi tiết",
      en: "Strong communication and writing skills; Patience and attention to detail",
    },
    benefits: {
      vi: "Lộ trình thăng tiến rõ ràng trong 12 tháng",
      en: "A clear 12-month career path",
    },
    extraFields: { fields: [] },
    posted: new Date("2026-09-08"),
    deadline: new Date("2026-10-25"),
    status: "PUBLISHED",
    applicants: 12,
    featured: false,
    department: "operations",
    location: "danang",
    type: "full-time",
    experienceId: "under-1",
  },
];

// Candidate/Application data (from candidates.ts)
const applicationsData = [
  {
    id: "c-001",
    code: "APP-001",
    jobId: "senior-frontend-engineer",
    name: "Nguyễn Minh Anh",
    email: "minhanh.nguyen@email.com",
    phone: "+84 912 345 678",
    location: "Hà Nội",
    stage: "interview",
    rating: 5,
    appliedAt: new Date("2026-09-03"),
    cvFile: "nguyen-minh-anh-cv.pdf",
    experience: "6 năm kinh nghiệm",
    highlights: [
      { vi: "Dẫn dắt đội frontend 5 người tại công ty fintech", en: "Led a 5-person frontend team at a fintech company" },
      { vi: "Xây dựng hệ thống thiết kế dùng chung cho 3 sản phẩm", en: "Built a shared design system across 3 products" },
    ],
    notes: [
      {
        author: "Trần Thu Hà",
        at: "2026-09-06",
        body: {
          vi: "Vòng kỹ thuật rất tốt, tư duy hệ thống rõ ràng. Đề xuất chuyển vòng cuối.",
          en: "Strong technical round, clear systems thinking. Recommend moving to the final round.",
        },
      },
    ],
  },
  {
    id: "c-002",
    code: "APP-002",
    jobId: "product-designer",
    name: "Lê Quốc Bảo",
    email: "quocbao.le@email.com",
    phone: "+84 938 221 004",
    location: "TP. Hồ Chí Minh",
    stage: "screening",
    rating: 4,
    appliedAt: new Date("2026-09-07"),
    cvFile: "le-quoc-bao-portfolio.pdf",
    experience: "4 năm kinh nghiệm",
    highlights: [
      { vi: "Portfolio mạnh về sản phẩm B2B", en: "Strong B2B product portfolio" },
      { vi: "Có kinh nghiệm nghiên cứu người dùng định tính", en: "Experienced in qualitative user research" },
    ],
    notes: [
      {
        author: "Phạm Đức Long",
        at: "2026-09-08",
        body: {
          vi: "Hồ sơ phù hợp, cần kiểm tra thêm kinh nghiệm làm việc với đội kỹ thuật.",
          en: "Good fit overall, need to probe collaboration with engineering.",
        },
      },
    ],
  },
  {
    id: "c-003",
    code: "APP-003",
    jobId: "data-analyst",
    name: "Trần Khánh Linh",
    email: "khanhlinh.tran@email.com",
    phone: "+84 905 776 112",
    location: "Đà Nẵng",
    stage: "new",
    rating: 3,
    appliedAt: new Date("2026-09-11"),
    cvFile: "tran-khanh-linh-cv.pdf",
    experience: "2 năm kinh nghiệm",
    highlights: [{ vi: "Thành thạo SQL và Power BI", en: "Strong SQL and Power BI" }],
    notes: [],
  },
  {
    id: "c-004",
    code: "APP-004",
    jobId: "enterprise-account-executive",
    name: "Vũ Hoàng Nam",
    email: "hoangnam.vu@email.com",
    phone: "+84 977 310 445",
    location: "TP. Hồ Chí Minh",
    stage: "offer",
    rating: 5,
    appliedAt: new Date("2026-08-29"),
    cvFile: "vu-hoang-nam-cv.pdf",
    experience: "7 năm kinh nghiệm",
    highlights: [
      { vi: "Đạt 128% chỉ tiêu năm 2025", en: "Hit 128% of the 2025 quota" },
      { vi: "Mạng lưới khách hàng doanh nghiệp rộng", en: "Wide enterprise customer network" },
    ],
    notes: [
      {
        author: "Đỗ Thanh Mai",
        at: "2026-09-09",
        body: { vi: "Đã gửi thư đề nghị, chờ phản hồi trước 15/09.", en: "Offer sent, awaiting response before Sep 15." },
      },
    ],
  },
  {
    id: "c-005",
    code: "APP-005",
    jobId: "hr-business-partner",
    name: "Phạm Thùy Dương",
    email: "thuyduong.pham@email.com",
    phone: "+84 966 118 220",
    location: "Hà Nội",
    stage: "interview",
    rating: 4,
    appliedAt: new Date("2026-09-01"),
    cvFile: "pham-thuy-duong-cv.pdf",
    experience: "8 năm kinh nghiệm",
    highlights: [
      { vi: "Từng xây khung năng lực cho công ty 500 nhân sự", en: "Built a competency framework for a 500-person company" },
    ],
    notes: [],
  },
  {
    id: "c-006",
    code: "APP-006",
    jobId: "senior-frontend-engineer",
    name: "Hoàng Gia Huy",
    email: "giahuy.hoang@email.com",
    phone: "+84 903 664 187",
    location: "Hà Nội",
    stage: "rejected",
    rating: 2,
    appliedAt: new Date("2026-08-30"),
    cvFile: "hoang-gia-huy-cv.pdf",
    experience: "3 năm kinh nghiệm",
    highlights: [{ vi: "Chủ yếu làm việc với Vue", en: "Mostly Vue background" }],
    notes: [
      {
        author: "Trần Thu Hà",
        at: "2026-09-02",
        body: { vi: "Chưa đủ kinh nghiệm React ở quy mô lớn.", en: "Not enough large-scale React experience yet." },
      },
    ],
  },
  {
    id: "c-007",
    code: "APP-007",
    jobId: "customer-success-specialist",
    name: "Đặng Bảo Châu",
    email: "baochau.dang@email.com",
    phone: "+84 944 205 338",
    location: "Đà Nẵng",
    stage: "screening",
    rating: 4,
    appliedAt: new Date("2026-09-10"),
    cvFile: "dang-bao-chau-cv.pdf",
    experience: "1 năm kinh nghiệm",
    highlights: [{ vi: "Giao tiếp tiếng Anh tốt", en: "Confident English communication" }],
    notes: [],
  },
  {
    id: "c-008",
    code: "APP-008",
    jobId: "product-designer",
    name: "Ngô Tuấn Kiệt",
    email: "tuankiet.ngo@email.com",
    phone: "+84 918 472 909",
    location: "TP. Hồ Chí Minh",
    stage: "hired",
    rating: 5,
    appliedAt: new Date("2026-08-12"),
    cvFile: "ngo-tuan-kiet-cv.pdf",
    experience: "5 năm kinh nghiệm",
    highlights: [{ vi: "Nhận việc từ 01/10/2026", en: "Starting October 1, 2026" }],
    notes: [
      {
        author: "Đỗ Thanh Mai",
        at: "2026-09-05",
        body: { vi: "Đã ký hợp đồng, chuẩn bị onboarding.", en: "Contract signed, onboarding in preparation." },
      },
    ],
  },
];

// News articles (from news-store.tsx)
const newsData = [
  {
    id: "a1",
    code: "NEWS-001",
    categoryId: "recruitment",
    slug: "ngay-hoi-tuyen-dung-2026",
    title: { vi: "Ngày hội tuyển dụng 2026: gặp gỡ hơn 300 ứng viên", en: "Careers Day 2026: meeting more than 300 candidates" },
    excerpt: { vi: "Một ngày kết nối trực tiếp giữa đội ngũ tuyển dụng và các bạn trẻ đam mê công nghệ.", en: "A day of direct connection between our hiring team and young tech talent." },
    body: {
      vi: "Ngày hội tuyển dụng năm nay diễn ra tại ba thành phố với hơn 300 ứng viên tham dự.",
      en: "This year's careers day took place in three cities with more than 300 candidates.",
    },
    authorId: "u-admin",
    date: new Date("2026-03-12"),
    published: true,
    featured: true,
    coverUrl: "",
  },
  {
    id: "a2",
    code: "NEWS-002",
    categoryId: "culture",
    slug: "van-hoa-hoc-tap-lien-tuc",
    title: { vi: "Văn hóa học tập liên tục tại công ty", en: "A culture of continuous learning" },
    excerpt: { vi: "Mỗi thành viên có ngân sách học tập riêng và hai giờ mỗi tuần dành cho phát triển bản thân.", en: "Every teammate gets a learning budget and two hours a week for personal growth." },
    body: {
      vi: "Chúng tôi tin rằng con người phát triển thì sản phẩm mới phát triển.",
      en: "We believe products grow when people grow.",
    },
    authorId: "u-admin",
    date: new Date("2026-02-02"),
    published: true,
    featured: false,
    coverUrl: "",
  },
  {
    id: "a3",
    code: "NEWS-003",
    categoryId: "company",
    slug: "khai-truong-van-phong-da-nang",
    title: { vi: "Khai trương văn phòng Đà Nẵng", en: "Opening our Da Nang office" },
    excerpt: { vi: "Không gian làm việc mới với sức chứa 120 chỗ ngồi bên bờ sông Hàn.", en: "A new 120-seat workspace by the Han river." },
    body: {
      vi: "Văn phòng Đà Nẵng chính thức đi vào hoạt động, mở thêm cơ hội cho các bạn ở khu vực miền Trung.",
      en: "Our Da Nang office is now open, creating new opportunities in central Vietnam.",
    },
    authorId: "u-admin",
    date: new Date("2026-01-08"),
    published: true,
    featured: false,
    coverUrl: "",
  },
];

// Admin users (from auth-store.tsx)
const DEFAULT_ADMIN_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

const usersData = [
  {
    id: "u-admin",
    code: "USER-001",
    email: "admin@talenthub.vn",
    passwordHash: DEFAULT_ADMIN_HASH,
    name: "Quản trị viên",
    role: "ADMIN",
  },
];

// Default site config (from site-config.tsx)
const defaultSiteConfig = {
  layout: "classic",
  paletteId: "navy",
  primary: "#1b2a41",
  accent: "#e8a33d",
  surfaceTone: "tinted",
  images: {
    hero: "",
    heroImages: [],
    culture: "",
    logo: "",
  },
  copy: {
    brand: { vi: "TalentHub", en: "TalentHub" },
    tagline: { vi: "Tuyển dụng & Nhân sự", en: "Talent & People" },
    eyebrow: { vi: "Chúng tôi đang tuyển", en: "We are hiring" },
    title: { vi: "Nơi những người giỏi nhất xây dựng điều đáng giá", en: "Where great people build things that matter" },
    subtitle: { vi: "Hơn 400 đồng nghiệp tại Hà Nội, Đà Nẵng và TP. Hồ Chí Minh đang cùng nhau tạo ra sản phẩm phục vụ hàng triệu người dùng mỗi ngày.", en: "More than 400 colleagues across Hanoi, Da Nang and Ho Chi Minh City are building products used by millions every day." },
    ctaLabel: { vi: "Tìm việc làm", en: "Search jobs" },
  },
  sections: {},
  company: {
    intro: { vi: "Chúng tôi xây dựng các sản phẩm số giúp doanh nghiệp vận hành hiệu quả hơn.", en: "We build digital products that help businesses run better." },
    email: "careers@talenthub.vn",
    phone: "+84 28 1234 5678",
    website: "",
    legalName: "",
    taxId: "",
    locations: [],
    social: { facebook: "", linkedin: "", youtube: "", github: "", zalo: "", tiktok: "" },
    copyright: { vi: "", en: "" },
  },
  about: {},
  jobsPage: { filterLayout: "sidebar", filters: { department: true, location: true, workType: true, level: true, status: true, salary: true, experience: true }, card: { salary: true, deadline: true, featuredBadge: true }, pageSize: 8, title: { vi: "Vị trí đang tuyển", en: "Open positions" }, subtitle: { vi: "Chọn bộ lọc để tìm vị trí phù hợp.", en: "Use the filters to find a role that fits." } },
  modules: { news: true, openApplication: true },
};

// Default form config (from form-config.tsx)
const defaultFormConfig = {
  sections: [
    {
      id: "profile",
      title: { vi: "Thông tin cá nhân", en: "Your details" },
      includeJobFields: false,
      fields: [
        { id: "fullName", type: "text", label: { vi: "Họ và tên", en: "Full name" }, required: true, fullWidth: false, maxLength: 100 },
        { id: "email", type: "email", label: { vi: "Email", en: "Email" }, required: true, fullWidth: false, maxLength: 255 },
        { id: "phone", type: "tel", label: { vi: "Số điện thoại", en: "Phone number" }, required: true, fullWidth: false, maxLength: 20 },
        { id: "city", type: "text", label: { vi: "Nơi ở hiện tại", en: "Current location" }, required: false, fullWidth: false, maxLength: 100 },
      ],
    },
    {
      id: "cv",
      title: { vi: "Hồ sơ & CV", en: "Resume & CV" },
      includeJobFields: false,
      fields: [
        { id: "cv", type: "file", label: { vi: "Tải lên CV", en: "Upload your CV" }, required: true, fullWidth: true },
        { id: "coverLetter", type: "textarea", label: { vi: "Thư giới thiệu", en: "Cover letter" }, required: false, fullWidth: true, maxLength: 1000 },
      ],
    },
  ],
  submitLabel: { vi: "Gửi hồ sơ ứng tuyển", en: "Submit application" },
  successTitle: { vi: "Đã nhận hồ sơ của bạn", en: "Application received" },
  successBody: { vi: "Cảm ơn bạn đã ứng tuyển. Đội ngũ nhân sự sẽ phản hồi trong vòng 5 ngày làm việc.", en: "Thanks for applying. Our people team will get back to you within five working days." },
};

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.$executeRaw`TRUNCATE TABLE applications, jobs, news, taxonomies, users, site_configs, form_configs CASCADE`;

  // Seed taxonomies
  console.log("📦 Seeding taxonomies...");
  for (const t of taxonomyData) {
    await prisma.taxonomy.create({
      data: {
        code: t.type.toUpperCase(),
        type: t.type,
        name: t.items, // Store items as Json array under `name`
        slug: t.slug,
        usercreate_at: "seed",
      },
    });
  }

  // Seed admin users
  console.log("👤 Seeding users...");
  for (const u of usersData) {
    await prisma.user.create({
      data: {
        id: u.id,
        code: u.code,
        email: u.email,
        passwordHash: u.passwordHash,
        name: u.name,
        role: u.role as any,
        usercreate_at: "seed",
      },
    });
  }

  // Seed jobs
  console.log("💼 Seeding jobs...");
  for (const j of jobsData) {
    await prisma.job.create({
      data: {
        id: j.id,
        code: j.code,
        title: j.title,
        slug: j.slug,
        description: j.description,
        requirements: j.requirements,
        benefits: j.benefits,
        extraFields: j.extraFields,
        posted: j.posted,
        deadline: j.deadline,
        status: j.status as any,
        applicants: j.applicants,
        featured: j.featured,
        department: j.department,
        location: j.location,
        type: j.type,
        experienceId: j.experienceId,
        usercreate_at: "seed",
      },
    });
  }

  // Seed applications
  console.log("📄 Seeding applications...");
  for (const a of applicationsData) {
    await prisma.application.create({
      data: {
        id: a.id,
        code: a.code,
        jobId: a.jobId,
        name: a.name,
        email: a.email,
        phone: a.phone,
        location: a.location,
        stage: mapApplicationStage(a.stage),
        rating: a.rating,
        appliedAt: a.appliedAt,
        cvFile: a.cvFile,
        experience: a.experience,
        highlights: a.highlights,
        notes: a.notes,
        resumeUrl: a.cvFile || "uploads/resume.pdf",
        status: mapApplicationStage(a.stage) as any,
        usercreate_at: "seed",
      },
    });
  }

  // Seed news
  console.log("📰 Seeding news...");
  for (const n of newsData) {
    await prisma.news.create({
      data: {
        id: n.id,
        code: n.code,
        categoryId: n.categoryId,
        title: n.title,
        slug: n.slug,
        authorId: n.authorId,
        date: n.date,
        published: n.published,
        featured: n.featured,
        excerpt: n.excerpt,
        coverUrl: n.coverUrl,
        usercreate_at: "seed",
      },
    });
  }

  // Seed site config
  console.log("⚙️  Seeding site config...");
  await prisma.siteConfig.create({
    data: {
      id: "default",
      layout: defaultSiteConfig.layout,
      paletteId: defaultSiteConfig.paletteId,
      primary: defaultSiteConfig.primary,
      accent: defaultSiteConfig.accent,
      surfaceTone: defaultSiteConfig.surfaceTone,
      images: defaultSiteConfig.images,
      copy: defaultSiteConfig.copy,
      sections: defaultSiteConfig.sections,
      company: defaultSiteConfig.company,
      about: defaultSiteConfig.about,
      jobsPage: defaultSiteConfig.jobsPage,
      modules: defaultSiteConfig.modules,
    },
  });

  // Seed form config
  console.log("📋 Seeding form config...");
  await prisma.formConfig.create({
    data: {
      id: "default",
      name: "Application Form",
      sections: defaultFormConfig.sections,
      submitLabel: defaultFormConfig.submitLabel,
      successTitle: defaultFormConfig.successTitle,
      successBody: defaultFormConfig.successBody,
    },
  });

  console.log("✅ Seed complete!");
  console.log("   - 5 taxonomy groups (departments, workTypes, salaries, experiences, locations)");
  console.log("   - 1 admin user (admin / admin123)");
  console.log("   - 7 jobs");
  console.log("   - 8 applications");
  console.log("   - 3 news articles");
  console.log("   - 1 site config");
  console.log("   - 1 form config");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
