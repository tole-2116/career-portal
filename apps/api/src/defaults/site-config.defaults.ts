export type SiteConfigPayload = {
  layout: string;
  paletteId: string;
  primary: string;
  accent: string;
  surfaceTone: string;
  images: Record<string, unknown>;
  copy: Record<string, unknown>;
  sections: Record<string, unknown>;
  company: Record<string, unknown>;
  about: Record<string, unknown>;
  recruitmentProcess: Record<string, unknown>;
  recruitmentGuide: Record<string, unknown>;
  jobsPage: Record<string, unknown>;
  modules: { news: boolean; openApplication: boolean; recruitmentProcess: boolean; recruitmentGuide: boolean };
};

/**
 * Server-safe baseline. The web client merges this payload with its richer
 * defaults, so the API never needs to depend on the React/localStorage module.
 */
export const defaultSiteConfig: SiteConfigPayload = {
  layout: "classic",
  paletteId: "navy",
  primary: "#1b2a41",
  accent: "#e8a33d",
  surfaceTone: "tinted",
  images: { hero: "", heroImages: [], culture: "", logo: "" },
  copy: {
    brand: { vi: "TalentHub", en: "TalentHub" },
    tagline: { vi: "Tuyển dụng & Nhân sự", en: "Talent & People" },
    eyebrow: { vi: "Chúng tôi đang tuyển", en: "We are hiring" },
    title: {
      vi: "Nơi những người giỏi nhất xây dựng điều đáng giá",
      en: "Where great people build things that matter",
    },
    subtitle: {
      vi: "Hơn 400 đồng nghiệp tại Hà Nội, Đà Nẵng và TP. Hồ Chí Minh đang cùng nhau tạo ra sản phẩm phục vụ hàng triệu người dùng mỗi ngày.",
      en: "More than 400 colleagues across Hanoi, Da Nang and Ho Chi Minh City are building products used by millions every day.",
    },
    ctaLabel: { vi: "Tìm việc làm", en: "Search jobs" },
  },
  sections: {},
  company: {
    intro: {
      vi: "Chúng tôi xây dựng các sản phẩm số giúp doanh nghiệp vận hành hiệu quả hơn.",
      en: "We build digital products that help businesses run better.",
    },
    locations: [],
    email: "careers@talenthub.vn",
    phone: "+84 28 1234 5678",
    website: "",
    legalName: "",
    taxId: "",
    social: { facebook: "", linkedin: "", youtube: "", github: "", zalo: "", tiktok: "" },
    copyright: { vi: "", en: "" },
  },
  about: {},
  recruitmentProcess: {},
  recruitmentGuide: {
    order: ["hero", "articles"],
    styles: {
      hero: { layout: "left", tone: "brand", spacing: "spacious" },
      articles: { layout: "left", tone: "white", spacing: "normal" },
    },
    hero: {
      enabled: true,
      eyebrow: { vi: "Cẩm nang tuyển dụng", en: "Recruitment guide" },
      title: { vi: "Chuẩn bị tốt hơn cho hành trình nghề nghiệp", en: "Prepare for your next career move" },
      subtitle: { vi: "Những hướng dẫn thiết thực giúp bạn tự tin trong từng bước ứng tuyển.", en: "Practical guidance to help you feel confident at every step of your application." },
    },
    articles: {
      enabled: true,
      title: { vi: "Bài viết nổi bật", en: "Featured guides" },
      items: [
        { id: "resume", title: { vi: "Xây dựng CV nổi bật", en: "Build a standout CV" }, body: { vi: "Tập trung vào thành tựu, kỹ năng phù hợp và trình bày thông tin rõ ràng, súc tích.", en: "Highlight achievements and relevant skills, and keep your information clear and concise." } },
        { id: "interview", title: { vi: "Chuẩn bị phỏng vấn", en: "Prepare for interviews" }, body: { vi: "Tìm hiểu vị trí, chuẩn bị ví dụ cụ thể và dành câu hỏi để trao đổi với nhà tuyển dụng.", en: "Research the role, prepare specific examples and bring questions for the hiring team." } },
        { id: "followup", title: { vi: "Theo dõi sau ứng tuyển", en: "Follow up after applying" }, body: { vi: "Kiểm tra email thường xuyên và phản hồi lịch hẹn đúng hạn để quá trình diễn ra thuận lợi.", en: "Check your email regularly and respond to scheduling requests promptly." } },
      ],
    },
  },
  jobsPage: {
    filterLayout: "sidebar",
    filters: {
      department: true,
      location: true,
      workType: true,
      level: true,
      status: true,
      salary: true,
      experience: true,
    },
    card: { salary: true, deadline: true, featuredBadge: true },
    pageSize: 8,
    title: { vi: "Vị trí đang tuyển", en: "Open positions" },
    subtitle: { vi: "Chọn bộ lọc để tìm vị trí phù hợp.", en: "Use the filters to find a role that fits." },
  },
  modules: { news: true, openApplication: true, recruitmentProcess: true, recruitmentGuide: true },
};
