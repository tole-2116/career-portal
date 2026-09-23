import type { Localized } from "@/lib/i18n";

export type Stage = "new" | "screening" | "interview" | "offer" | "hired" | "rejected";

export const stageLabels: Record<Stage, Localized> = {
  new: { vi: "Hồ sơ mới", en: "New" },
  screening: { vi: "Sàng lọc", en: "Screening" },
  interview: { vi: "Phỏng vấn", en: "Interview" },
  offer: { vi: "Đề nghị", en: "Offer" },
  hired: { vi: "Đã tuyển", en: "Hired" },
  rejected: { vi: "Từ chối", en: "Rejected" },
};

export const stageOrder: Stage[] = ["new", "screening", "interview", "offer", "hired", "rejected"];

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: Localized;
  jobId: string;
  stage: Stage;
  rating: number;
  appliedAt: string;
  cvFile: string;
  experience: Localized;
  highlights: Localized[];
  notes: { author: string; at: string; body: Localized }[];
};

export const candidates: Candidate[] = [
  {
    id: "c-001",
    name: "Nguyễn Minh Anh",
    email: "minhanh.nguyen@email.com",
    phone: "+84 912 345 678",
    location: { vi: "Hà Nội", en: "Hanoi" },
    jobId: "senior-frontend-engineer",
    stage: "interview",
    rating: 5,
    appliedAt: "2026-09-03",
    cvFile: "nguyen-minh-anh-cv.pdf",
    experience: { vi: "6 năm kinh nghiệm", en: "6 years of experience" },
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
    name: "Lê Quốc Bảo",
    email: "quocbao.le@email.com",
    phone: "+84 938 221 004",
    location: { vi: "TP. Hồ Chí Minh", en: "Ho Chi Minh City" },
    jobId: "product-designer",
    stage: "screening",
    rating: 4,
    appliedAt: "2026-09-07",
    cvFile: "le-quoc-bao-portfolio.pdf",
    experience: { vi: "4 năm kinh nghiệm", en: "4 years of experience" },
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
    name: "Trần Khánh Linh",
    email: "khanhlinh.tran@email.com",
    phone: "+84 905 776 112",
    location: { vi: "Đà Nẵng", en: "Da Nang" },
    jobId: "data-analyst",
    stage: "new",
    rating: 3,
    appliedAt: "2026-09-11",
    cvFile: "tran-khanh-linh-cv.pdf",
    experience: { vi: "2 năm kinh nghiệm", en: "2 years of experience" },
    highlights: [{ vi: "Thành thạo SQL và Power BI", en: "Strong SQL and Power BI" }],
    notes: [],
  },
  {
    id: "c-004",
    name: "Vũ Hoàng Nam",
    email: "hoangnam.vu@email.com",
    phone: "+84 977 310 445",
    location: { vi: "TP. Hồ Chí Minh", en: "Ho Chi Minh City" },
    jobId: "enterprise-account-executive",
    stage: "offer",
    rating: 5,
    appliedAt: "2026-08-29",
    cvFile: "vu-hoang-nam-cv.pdf",
    experience: { vi: "7 năm kinh nghiệm", en: "7 years of experience" },
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
    name: "Phạm Thùy Dương",
    email: "thuyduong.pham@email.com",
    phone: "+84 966 118 220",
    location: { vi: "Hà Nội", en: "Hanoi" },
    jobId: "hr-business-partner",
    stage: "interview",
    rating: 4,
    appliedAt: "2026-09-01",
    cvFile: "pham-thuy-duong-cv.pdf",
    experience: { vi: "8 năm kinh nghiệm", en: "8 years of experience" },
    highlights: [
      { vi: "Từng xây khung năng lực cho công ty 500 nhân sự", en: "Built a competency framework for a 500-person company" },
    ],
    notes: [],
  },
  {
    id: "c-006",
    name: "Hoàng Gia Huy",
    email: "giahuy.hoang@email.com",
    phone: "+84 903 664 187",
    location: { vi: "Hà Nội", en: "Hanoi" },
    jobId: "senior-frontend-engineer",
    stage: "rejected",
    rating: 2,
    appliedAt: "2026-08-30",
    cvFile: "hoang-gia-huy-cv.pdf",
    experience: { vi: "3 năm kinh nghiệm", en: "3 years of experience" },
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
    name: "Đặng Bảo Châu",
    email: "baochau.dang@email.com",
    phone: "+84 944 205 338",
    location: { vi: "Đà Nẵng", en: "Da Nang" },
    jobId: "customer-success-specialist",
    stage: "screening",
    rating: 4,
    appliedAt: "2026-09-10",
    cvFile: "dang-bao-chau-cv.pdf",
    experience: { vi: "1 năm kinh nghiệm", en: "1 year of experience" },
    highlights: [{ vi: "Giao tiếp tiếng Anh tốt", en: "Confident English communication" }],
    notes: [],
  },
  {
    id: "c-008",
    name: "Ngô Tuấn Kiệt",
    email: "tuankiet.ngo@email.com",
    phone: "+84 918 472 909",
    location: { vi: "TP. Hồ Chí Minh", en: "Ho Chi Minh City" },
    jobId: "product-designer",
    stage: "hired",
    rating: 5,
    appliedAt: "2026-08-12",
    cvFile: "ngo-tuan-kiet-cv.pdf",
    experience: { vi: "5 năm kinh nghiệm", en: "5 years of experience" },
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

export const weeklyApplications = [
  { week: "T25", applications: 38 },
  { week: "T26", applications: 44 },
  { week: "T27", applications: 51 },
  { week: "T28", applications: 47 },
  { week: "T29", applications: 63 },
  { week: "T30", applications: 72 },
  { week: "T31", applications: 68 },
  { week: "T32", applications: 84 },
];

export const activity: { at: string; text: Localized }[] = [
  {
    at: "09:20",
    text: {
      vi: "Nguyễn Minh Anh chuyển sang vòng phỏng vấn cuối",
      en: "Nguyen Minh Anh moved to the final interview",
    },
  },
  {
    at: "08:45",
    text: { vi: "Tin “Chuyên viên Chăm sóc Khách hàng” được đăng", en: "“Customer Success Specialist” posting published" },
  },
  {
    at: "Hôm qua",
    text: { vi: "Vũ Hoàng Nam đã nhận thư đề nghị", en: "Vu Hoang Nam received an offer letter" },
  },
  {
    at: "Hôm qua",
    text: { vi: "12 hồ sơ mới cho vị trí Kỹ sư Frontend cấp cao", en: "12 new applications for Senior Frontend Engineer" },
  },
];
