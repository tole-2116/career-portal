import type { Localized } from "@/lib/i18n";

export type JobStatus = "draft" | "open" | "paused" | "expired" | "closed";

export type DynamicField = {
  id: string;
  label: Localized;
  type: "text" | "url" | "textarea" | "select";
  required: boolean;
  placeholder?: Localized;
  options?: Localized[];
};

export type Job = {
  id: string;
  title: Localized;
  departmentId?: string | undefined;
  department: Localized;
  locationIds?: string[] | undefined;
  locations: Localized[];
  workTypeId?: string | undefined;
  workType: Localized;
  level: Localized;
  salaryId?: string | undefined;
  salary: Localized;
  posted: string;
  deadline: string;
  status: JobStatus;
  applicants: number;
  featured: boolean;
  summary: Localized;
  description: Localized[];
  requirements: Localized[];
  benefits: Localized[];
  extraFields: DynamicField[];
  /** Số lượng cần tuyển */
  headcount?: number | undefined;
  /** Kinh nghiệm yêu cầu */
  experienceId?: string | undefined;
  experience?: Localized | undefined;
  /** Ngôn ngữ yêu cầu */
  languages?: Localized | undefined;
  /** Người phụ trách tuyển dụng */
  contactName?: string | undefined;
  /** Email liên hệ tuyển dụng */
  contactEmail?: string | undefined;
};

const engineeringFields: DynamicField[] = [
  {
    id: "github",
    label: { vi: "Liên kết GitHub / GitLab", en: "GitHub / GitLab link" },
    type: "url",
    required: true,
    placeholder: { vi: "https://github.com/ten-cua-ban", en: "https://github.com/yourname" },
  },
  {
    id: "stack",
    label: { vi: "Công nghệ bạn thành thạo nhất", en: "Technologies you know best" },
    type: "text",
    required: true,
    placeholder: { vi: "React, Node.js, PostgreSQL", en: "React, Node.js, PostgreSQL" },
  },
  {
    id: "experience",
    label: { vi: "Số năm kinh nghiệm", en: "Years of experience" },
    type: "select",
    required: true,
    options: [
      { vi: "Dưới 1 năm", en: "Less than 1 year" },
      { vi: "1 – 3 năm", en: "1 – 3 years" },
      { vi: "3 – 5 năm", en: "3 – 5 years" },
      { vi: "Trên 5 năm", en: "More than 5 years" },
    ],
  },
];

const designFields: DynamicField[] = [
  {
    id: "portfolio",
    label: { vi: "Liên kết portfolio", en: "Portfolio link" },
    type: "url",
    required: true,
    placeholder: { vi: "https://portfolio-cua-ban.com", en: "https://your-portfolio.com" },
  },
  {
    id: "tools",
    label: { vi: "Công cụ thiết kế sử dụng", en: "Design tools you use" },
    type: "text",
    required: true,
    placeholder: { vi: "Figma, Framer, After Effects", en: "Figma, Framer, After Effects" },
  },
  {
    id: "case",
    label: { vi: "Dự án bạn tâm đắc nhất", en: "The project you are proudest of" },
    type: "textarea",
    required: false,
  },
];

const salesFields: DynamicField[] = [
  {
    id: "quota",
    label: { vi: "Doanh số cao nhất từng đạt (VNĐ/năm)", en: "Highest annual quota achieved (VND)" },
    type: "text",
    required: true,
    placeholder: { vi: "5 tỷ", en: "5 billion" },
  },
  {
    id: "segment",
    label: { vi: "Phân khúc khách hàng quen thuộc", en: "Customer segment you know best" },
    type: "select",
    required: true,
    options: [
      { vi: "Doanh nghiệp lớn", en: "Enterprise" },
      { vi: "Doanh nghiệp vừa và nhỏ", en: "SMB" },
      { vi: "Khách hàng cá nhân", en: "Consumer" },
    ],
  },
];

const generalFields: DynamicField[] = [
  {
    id: "availability",
    label: { vi: "Thời gian có thể nhận việc", en: "Earliest start date" },
    type: "select",
    required: true,
    options: [
      { vi: "Ngay lập tức", en: "Immediately" },
      { vi: "Trong 2 tuần", en: "Within 2 weeks" },
      { vi: "Trong 1 tháng", en: "Within 1 month" },
      { vi: "Sau 1 tháng", en: "More than 1 month" },
    ],
  },
];

export const jobs: Job[] = [
  {
    id: "senior-frontend-engineer",
    title: { vi: "Kỹ sư Frontend cấp cao", en: "Senior Frontend Engineer" },
    department: { vi: "Công nghệ", en: "Engineering" },
    locations: [{ vi: "Hà Nội", en: "Hanoi" }],
    workType: { vi: "Toàn thời gian", en: "Full-time" },
    level: { vi: "Cấp cao", en: "Senior" },
    salary: { vi: "40 – 60 triệu VNĐ", en: "40 – 60M VND" },
    posted: "2026-08-28",
    deadline: "2026-10-15",
    status: "open",
    applicants: 42,
    featured: true,
    summary: {
      vi: "Dẫn dắt chất lượng giao diện cho sản phẩm được hơn hai triệu người dùng mỗi tháng.",
      en: "Own the interface quality of a product used by over two million people each month.",
    },
    description: [
      {
        vi: "Bạn sẽ làm việc cùng đội thiết kế và sản phẩm để biến ý tưởng thành giao diện chạy thật, nhanh và dễ dùng trên mọi thiết bị.",
        en: "You will work with design and product to turn ideas into real interfaces that are fast and usable on every device.",
      },
      {
        vi: "Bạn chịu trách nhiệm về hệ thống thành phần dùng chung, hiệu năng tải trang và trải nghiệm của người dùng cuối.",
        en: "You will own the shared component system, page performance and the end-user experience.",
      },
    ],
    requirements: [
      { vi: "Tối thiểu 4 năm kinh nghiệm với React và TypeScript", en: "At least 4 years with React and TypeScript" },
      { vi: "Hiểu sâu về hiệu năng trình duyệt và khả năng tiếp cận", en: "Strong grasp of browser performance and accessibility" },
      { vi: "Kinh nghiệm xây dựng hệ thống thiết kế dùng chung", en: "Experience building a shared design system" },
      { vi: "Giao tiếp tốt bằng tiếng Việt và tiếng Anh", en: "Comfortable communicating in Vietnamese and English" },
    ],
    benefits: [
      { vi: "Lương tháng 13 và thưởng hiệu suất theo quý", en: "13th month salary and quarterly performance bonus" },
      { vi: "Bảo hiểm sức khỏe cho bản thân và người thân", en: "Health insurance for you and your family" },
      { vi: "Làm việc linh hoạt 2 ngày/tuần tại nhà", en: "Two remote days every week" },
    ],
    extraFields: [...engineeringFields, ...generalFields],
  },
  {
    id: "product-designer",
    title: { vi: "Chuyên viên Thiết kế Sản phẩm", en: "Product Designer" },
    department: { vi: "Thiết kế", en: "Design" },
    locations: [{ vi: "TP. Hồ Chí Minh", en: "Ho Chi Minh City" }],
    workType: { vi: "Toàn thời gian", en: "Full-time" },
    level: { vi: "Trung cấp", en: "Mid-level" },
    salary: { vi: "30 – 45 triệu VNĐ", en: "30 – 45M VND" },
    posted: "2026-09-02",
    deadline: "2026-10-10",
    status: "open",
    applicants: 27,
    featured: true,
    summary: {
      vi: "Thiết kế các luồng nghiệp vụ phức tạp thành trải nghiệm rõ ràng, dễ dùng.",
      en: "Turn complex business flows into clear, usable experiences.",
    },
    description: [
      {
        vi: "Bạn tham gia từ giai đoạn nghiên cứu người dùng đến bàn giao giao diện chi tiết cho đội phát triển.",
        en: "You join from user research all the way to detailed hand-off with the engineering team.",
      },
    ],
    requirements: [
      { vi: "3 năm kinh nghiệm thiết kế sản phẩm số", en: "3 years designing digital products" },
      { vi: "Portfolio thể hiện tư duy giải quyết vấn đề", en: "A portfolio that shows problem-solving" },
      { vi: "Thành thạo Figma và nguyên tắc hệ thống thiết kế", en: "Fluent in Figma and design system principles" },
    ],
    benefits: [
      { vi: "Ngân sách học tập 20 triệu mỗi năm", en: "Annual learning budget of 20M VND" },
      { vi: "Thiết bị làm việc theo lựa chọn của bạn", en: "Your choice of work equipment" },
    ],
    extraFields: [...designFields, ...generalFields],
  },
  {
    id: "hr-business-partner",
    title: { vi: "Đối tác Nhân sự", en: "HR Business Partner" },
    department: { vi: "Nhân sự", en: "People" },
    locations: [{ vi: "Hà Nội", en: "Hanoi" }],
    workType: { vi: "Toàn thời gian", en: "Full-time" },
    level: { vi: "Cấp cao", en: "Senior" },
    salary: { vi: "35 – 50 triệu VNĐ", en: "35 – 50M VND" },
    posted: "2026-08-20",
    deadline: "2026-09-30",
    status: "open",
    applicants: 18,
    featured: true,
    summary: {
      vi: "Đồng hành cùng các trưởng bộ phận trong tuyển dụng, phát triển và giữ chân nhân tài.",
      en: "Partner with department heads on hiring, development and retention.",
    },
    description: [
      {
        vi: "Bạn là cầu nối giữa chiến lược nhân sự và nhu cầu thực tế của từng bộ phận kinh doanh.",
        en: "You bridge people strategy and the day-to-day needs of each business unit.",
      },
    ],
    requirements: [
      { vi: "5 năm kinh nghiệm nhân sự tại doanh nghiệp trên 200 người", en: "5 years in HR at companies of 200+ people" },
      { vi: "Kinh nghiệm xây dựng khung năng lực và lộ trình thăng tiến", en: "Experience building competency frameworks and career paths" },
    ],
    benefits: [
      { vi: "Chế độ nghỉ phép 18 ngày/năm", en: "18 days of annual leave" },
      { vi: "Khám sức khỏe định kỳ hằng năm", en: "Annual health check-up" },
    ],
    extraFields: generalFields,
  },
  {
    id: "enterprise-account-executive",
    title: { vi: "Chuyên viên Kinh doanh Doanh nghiệp", en: "Enterprise Account Executive" },
    department: { vi: "Kinh doanh", en: "Sales" },
    locations: [{ vi: "TP. Hồ Chí Minh", en: "Ho Chi Minh City" }],
    workType: { vi: "Toàn thời gian", en: "Full-time" },
    level: { vi: "Trung cấp", en: "Mid-level" },
    salary: { vi: "25 triệu + hoa hồng", en: "25M VND + commission" },
    posted: "2026-09-05",
    deadline: "2026-10-20",
    status: "open",
    applicants: 33,
    featured: false,
    summary: {
      vi: "Phát triển danh mục khách hàng doanh nghiệp lớn tại khu vực phía Nam.",
      en: "Grow our enterprise customer portfolio across the southern region.",
    },
    description: [
      {
        vi: "Bạn sở hữu toàn bộ chu trình bán hàng, từ tiếp cận đến ký kết và mở rộng hợp đồng.",
        en: "You own the full sales cycle, from first contact to signature and expansion.",
      },
    ],
    requirements: [
      { vi: "3 năm bán giải pháp phần mềm cho doanh nghiệp", en: "3 years selling software solutions to businesses" },
      { vi: "Kỹ năng đàm phán và trình bày trước lãnh đạo cấp cao", en: "Negotiation and executive presentation skills" },
    ],
    benefits: [
      { vi: "Hoa hồng không giới hạn", en: "Uncapped commission" },
      { vi: "Chuyến đi thưởng cho nhóm đạt chỉ tiêu", en: "Annual incentive trip for top performers" },
    ],
    extraFields: [...salesFields, ...generalFields],
  },
  {
    id: "data-analyst",
    title: { vi: "Chuyên viên Phân tích Dữ liệu", en: "Data Analyst" },
    department: { vi: "Công nghệ", en: "Engineering" },
    locations: [{ vi: "Đà Nẵng", en: "Da Nang" }],
    workType: { vi: "Kết hợp từ xa", en: "Hybrid" },
    level: { vi: "Mới bắt đầu", en: "Junior" },
    salary: { vi: "18 – 28 triệu VNĐ", en: "18 – 28M VND" },
    posted: "2026-08-15",
    deadline: "2026-09-28",
    status: "paused",
    applicants: 51,
    featured: false,
    summary: {
      vi: "Biến dữ liệu vận hành thành những quyết định có căn cứ cho đội ngũ sản phẩm.",
      en: "Turn operational data into grounded decisions for the product team.",
    },
    description: [
      {
        vi: "Bạn xây dựng báo cáo, theo dõi chỉ số và trả lời các câu hỏi kinh doanh bằng dữ liệu.",
        en: "You build reports, track metrics and answer business questions with data.",
      },
    ],
    requirements: [
      { vi: "Thành thạo SQL và một công cụ trực quan hóa", en: "Strong SQL plus one visualisation tool" },
      { vi: "Tư duy phản biện với số liệu", en: "Critical thinking about numbers" },
    ],
    benefits: [
      { vi: "Hỗ trợ chi phí làm việc từ xa", en: "Remote work stipend" },
      { vi: "Cố vấn 1-1 hằng tháng", en: "Monthly one-on-one mentoring" },
    ],
    extraFields: [...engineeringFields, ...generalFields],
  },
  {
    id: "marketing-lead",
    title: { vi: "Trưởng nhóm Marketing", en: "Marketing Lead" },
    department: { vi: "Marketing", en: "Marketing" },
    locations: [{ vi: "Hà Nội", en: "Hanoi" }],
    workType: { vi: "Kết hợp từ xa", en: "Hybrid" },
    level: { vi: "Quản lý", en: "Lead" },
    salary: { vi: "45 – 60 triệu VNĐ", en: "45 – 60M VND" },
    posted: "2026-07-30",
    deadline: "2026-09-15",
    status: "closed",
    applicants: 64,
    featured: false,
    summary: {
      vi: "Dẫn dắt chiến lược thương hiệu và tăng trưởng cho thị trường Việt Nam.",
      en: "Lead brand and growth strategy for the Vietnamese market.",
    },
    description: [
      {
        vi: "Bạn quản lý một nhóm bốn người và ngân sách truyền thông hằng quý.",
        en: "You manage a team of four and the quarterly marketing budget.",
      },
    ],
    requirements: [
      { vi: "5 năm kinh nghiệm marketing, ít nhất 2 năm quản lý", en: "5 years in marketing, at least 2 leading a team" },
    ],
    benefits: [{ vi: "Thưởng theo kết quả tăng trưởng", en: "Growth-based bonus" }],
    extraFields: generalFields,
  },
  {
    id: "customer-success-specialist",
    title: { vi: "Chuyên viên Chăm sóc Khách hàng", en: "Customer Success Specialist" },
    department: { vi: "Vận hành", en: "Operations" },
    locations: [{ vi: "Đà Nẵng", en: "Da Nang" }],
    workType: { vi: "Toàn thời gian", en: "Full-time" },
    level: { vi: "Mới bắt đầu", en: "Junior" },
    salary: { vi: "15 – 22 triệu VNĐ", en: "15 – 22M VND" },
    posted: "2026-09-08",
    deadline: "2026-10-25",
    status: "open",
    applicants: 12,
    featured: false,
    summary: {
      vi: "Đồng hành cùng khách hàng từ ngày đầu tiên đến khi họ đạt kết quả mong muốn.",
      en: "Walk with customers from day one until they reach the outcome they came for.",
    },
    description: [
      {
        vi: "Bạn hướng dẫn khách hàng sử dụng sản phẩm, xử lý vướng mắc và thu thập phản hồi.",
        en: "You onboard customers, resolve issues and collect feedback for the product team.",
      },
    ],
    requirements: [
      { vi: "Kỹ năng giao tiếp và viết tốt", en: "Strong communication and writing skills" },
      { vi: "Kiên nhẫn và chú ý đến chi tiết", en: "Patience and attention to detail" },
    ],
    benefits: [
      { vi: "Lộ trình thăng tiến rõ ràng trong 12 tháng", en: "A clear 12-month career path" },
    ],
    extraFields: generalFields,
  },
];

export function getJob(id: string) {
  return jobs.find((job) => job.id === id);
}

export const departments = Array.from(
  new Map(jobs.map((job) => [job.department.en, job.department])).values(),
);
export const locations = Array.from(
  new Map(jobs.flatMap((job) => job.locations).map((loc) => [loc.en, loc])).values(),
);
export const workTypes = Array.from(
  new Map(jobs.map((job) => [job.workType.en, job.workType])).values(),
);
export const levels = Array.from(
  new Map(jobs.map((job) => [job.level.en, job.level])).values(),
);
