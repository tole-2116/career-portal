import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { defaultMedia } from "@/data/media";
import type { Localized } from "@/lib/i18n";

const STORAGE_KEY = "talenthub-site-config";

export const layoutIds = ["classic", "split", "bento", "editorial", "spotlight"] as const;
export type LayoutId = (typeof layoutIds)[number];

export type LayoutPreset = {
  id: LayoutId;
  name: Localized;
  description: Localized;
};

export const layoutPresets: LayoutPreset[] = [
  {
    id: "classic",
    name: { vi: "Cổ điển doanh nghiệp", en: "Corporate classic" },
    description: {
      vi: "Ảnh bìa lớn, ô tìm việc nổi ở giữa, dải số liệu và việc làm nổi bật.",
      en: "Large cover image, centered search box, stats band and featured roles.",
    },
  },
  {
    id: "split",
    name: { vi: "Chia đôi màn hình", en: "Split screen" },
    description: {
      vi: "Thông điệp bên trái, ảnh đội ngũ bên phải, lưới việc làm bên dưới.",
      en: "Message on the left, team photo on the right, job grid below.",
    },
  },
  {
    id: "bento",
    name: { vi: "Lưới ô vuông", en: "Bento grid" },
    description: {
      vi: "Các ô kích thước khác nhau: thông điệp, ảnh, số liệu, phúc lợi.",
      en: "Mixed-size tiles: message, image, stats and benefits.",
    },
  },
  {
    id: "editorial",
    name: { vi: "Tối giản kiểu tạp chí", en: "Editorial minimal" },
    description: {
      vi: "Tiêu đề lớn, nhiều khoảng trắng, danh sách việc làm dạng dòng kẻ.",
      en: "Big headline, generous whitespace, jobs as a clean list.",
    },
  },
  {
    id: "spotlight",
    name: { vi: "Nền tối nổi bật", en: "Dark spotlight" },
    description: {
      vi: "Nền tối, màu nhấn rực, ảnh phủ mờ và thẻ việc làm tương phản cao.",
      en: "Dark canvas, vivid accent, overlay image and high-contrast cards.",
    },
  },
];

export type PalettePreset = {
  id: string;
  name: Localized;
  primary: string;
  accent: string;
  swatches: string[];
};

export const palettePresets: PalettePreset[] = [
  {
    id: "navy",
    name: { vi: "Navy & hổ phách", en: "Navy & amber" },
    primary: "#1b2a41",
    accent: "#e8a33d",
    swatches: ["#1b2a41", "#2f4a6d", "#e8a33d", "#f5f3ef"],
  },
  {
    id: "emerald",
    name: { vi: "Xanh ngọc sang trọng", en: "Emerald prestige" },
    primary: "#0d7a5f",
    accent: "#c9a84c",
    swatches: ["#064e3b", "#0d7a5f", "#c9a84c", "#f5f0e0"],
  },
  {
    id: "ember",
    name: { vi: "Than & lửa", en: "Charcoal & ember" },
    primary: "#2d2d2d",
    accent: "#e85d3a",
    swatches: ["#1a1a1a", "#2d2d2d", "#e85d3a", "#f2ede9"],
  },
  {
    id: "cloud",
    name: { vi: "Trắng mây", en: "Cloud white" },
    primary: "#334155",
    accent: "#3b82f6",
    swatches: ["#fafbfc", "#e8ecf1", "#94a3b8", "#3b82f6"],
  },
  {
    id: "sand",
    name: { vi: "Cát ấm", en: "Warm sand" },
    primary: "#6b563c",
    accent: "#c07a3e",
    swatches: ["#faf8f5", "#f0ebe3", "#c9b99a", "#8b7355"],
  },
  {
    id: "ocean",
    name: { vi: "Xanh đại dương", en: "Ocean deep" },
    primary: "#1a4a6e",
    accent: "#2d8a9e",
    swatches: ["#0c2340", "#1a4a6e", "#2d8a9e", "#5cbdb9"],
  },
  {
    id: "trust",
    name: { vi: "Xanh tin cậy", en: "Trust blue" },
    primary: "#12356b",
    accent: "#2f7fe0",
    swatches: ["#0b2350", "#12356b", "#2f7fe0", "#e6eefb"],
  },
  {
    id: "violet",
    name: { vi: "Tím công nghệ", en: "Tech violet" },
    primary: "#372a70",
    accent: "#7c5cf0",
    swatches: ["#241a4d", "#372a70", "#7c5cf0", "#ece8fd"],
  },
  {
    id: "burgundy",
    name: { vi: "Đỏ đô sang trọng", en: "Prestige burgundy" },
    primary: "#5a1b2e",
    accent: "#c9925b",
    swatches: ["#3d1220", "#5a1b2e", "#c9925b", "#f6ecdf"],
  },
];

export type SiteCopy = {
  brand: Localized;
  tagline: Localized;
  eyebrow: Localized;
  title: Localized;
  subtitle: Localized;
  ctaLabel: Localized;
};

export type CompanyLocation = {
  id: string;
  name: Localized;
  address: Localized;
};

export type CompanyInfo = {
  intro: Localized;
  locations: CompanyLocation[];
  email: string;
  phone: string;
  website: string;
  legalName: string;
  taxId: string;
  social: {
    facebook: string;
    linkedin: string;
    youtube: string;
    github: string;
    zalo: string;
    tiktok: string;
  };
  copyright: Localized;
};

export type HomeItemConfig = {
  id: string;
  icon: string;
  title: Localized;
  body: Localized;
};

export type StatConfig = {
  id: string;
  value: string;
  label: Localized;
  /** When true the value is replaced by the live count of open roles. */
  auto?: boolean;
};

export type SectionHeader = {
  enabled: boolean;
  eyebrow: Localized;
  title: Localized;
  description: Localized;
};

export const homeWidgetKeys = ["hero", "stats", "culture", "benefits", "jobs", "cta"] as const;
export type HomeWidgetKey = (typeof homeWidgetKeys)[number];

export type SiteSections = {
  order: HomeWidgetKey[];
  styles: Record<HomeWidgetKey, AboutWidgetStyle>;
  hero: { enabled: boolean };
  stats: { enabled: boolean; items: StatConfig[] };
  culture: SectionHeader & { items: HomeItemConfig[] };
  benefits: SectionHeader & { items: HomeItemConfig[] };
  jobs: SectionHeader & { allLabel: Localized; count: number };
  cta: { enabled: boolean; title: Localized; body: Localized; buttonLabel: Localized };
};

export type AboutStat = { id: string; value: string; label: Localized };
export type AboutMilestone = { id: string; year: string; title: Localized; body: Localized };
export type AboutValue = { id: string; icon: string; title: Localized; body: Localized };
export type AboutLeader = { id: string; name: string; role: Localized; photo: string };
export type AboutPhoto = { id: string; url: string; caption: Localized };
export type AboutWidgetKey = "hero" | "story" | "timeline" | "values" | "leaders" | "gallery" | "contact";
export type AboutWidgetTone = "white" | "soft" | "brand";
export type AboutWidgetSpacing = "compact" | "normal" | "spacious";
export type AboutWidgetStyle = {
  layout: string;
  tone: AboutWidgetTone;
  spacing: AboutWidgetSpacing;
};

export type AboutConfig = {
  order: AboutWidgetKey[];
  styles: Record<AboutWidgetKey, AboutWidgetStyle>;
  hero: {
    enabled: boolean;
    eyebrow: Localized;
    title: Localized;
    subtitle: Localized;
    image: string;
    stats: AboutStat[];
  };
  story: {
    enabled: boolean;
    title: Localized;
    paragraphs: Localized[];
    image: string;
  };
  timeline: { enabled: boolean; title: Localized; items: AboutMilestone[] };
  values: { enabled: boolean; title: Localized; description: Localized; items: AboutValue[] };
  leaders: { enabled: boolean; title: Localized; items: AboutLeader[] };
  gallery: { enabled: boolean; title: Localized; items: AboutPhoto[] };
  contact: { enabled: boolean };
};


export type JobsPageConfig = {
  /** "sidebar" = filters in a left column, "bar" = horizontal filter bar */
  filterLayout: "sidebar" | "bar";
  filters: {
    department: boolean;
    location: boolean;
    workType: boolean;
    level: boolean;
    status: boolean;
    salary: boolean;
    experience: boolean;
  };
  card: { salary: boolean; deadline: boolean; featuredBadge: boolean };
  pageSize: number;
  title: Localized;
  subtitle: Localized;
};

export type SiteConfig = {
  layout: LayoutId;
  paletteId: string;
  primary: string;
  accent: string;
  surfaceTone: SurfaceTone;
  /** `hero` stays for compatibility; `heroImages` drives the home slideshow (max 5). */
  images: { hero: string; heroImages: string[]; culture: string; logo: string };
  copy: SiteCopy;
  sections: SiteSections;
  company: CompanyInfo;
  about: AboutConfig;

  jobsPage: JobsPageConfig;
  /** Optional modules each project can switch on or off. */
  modules: { news: boolean; openApplication: boolean };
};

const empty: Localized = { vi: "", en: "" };

export const defaultJobsPage: JobsPageConfig = {
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
  subtitle: {
    vi: "Chọn bộ lọc để tìm vị trí phù hợp với kinh nghiệm và nơi bạn muốn làm việc.",
    en: "Use the filters to find a role that matches your experience and where you want to work.",
  },
};

export const defaultCompany: CompanyInfo = {
  intro: {
    vi: "Chúng tôi xây dựng các sản phẩm số giúp doanh nghiệp vận hành hiệu quả hơn, với niềm tin rằng công nghệ tốt đến từ những con người được trao cơ hội phát triển.",
    en: "We build digital products that help businesses run better, believing great technology comes from people given room to grow.",
  },
  locations: [
    {
      id: "hq",
      name: { vi: "Trụ sở chính — TP. Hồ Chí Minh", en: "Head office — Ho Chi Minh City" },
      address: {
        vi: "371 Nguyễn Kiệm, Phường Hạnh Thông, TP. Hồ Chí Minh",
        en: "371 Nguyen Kiem, Hanh Thong Ward, Ho Chi Minh City",
      },
    },
    {
      id: "hanoi",
      name: { vi: "Văn phòng Hà Nội", en: "Hanoi office" },
      address: {
        vi: "Tầng 8, 219 Trung Kính, Phường Yên Hòa, Hà Nội",
        en: "8th floor, 219 Trung Kinh, Yen Hoa Ward, Hanoi",
      },
    },
    {
      id: "danang",
      name: { vi: "Văn phòng Đà Nẵng", en: "Da Nang office" },
      address: {
        vi: "Tầng 5, 254 Nguyễn Văn Linh, Quận Thanh Khê, Đà Nẵng",
        en: "5th floor, 254 Nguyen Van Linh, Thanh Khe District, Da Nang",
      },
    },
  ],
  email: "careers@talenthub.vn",
  phone: "+84 28 1234 5678",
  website: "",
  legalName: "",
  taxId: "",
  social: {
    facebook: "",
    linkedin: "",
    youtube: "",
    github: "",
    zalo: "",
    tiktok: "",
  },
  copyright: { ...empty },
};

export const defaultSections: SiteSections = {
  order: ["hero", "stats", "culture", "benefits", "jobs", "cta"],
  styles: {
    hero: { layout: "left", tone: "brand", spacing: "spacious" },
    stats: { layout: "row", tone: "soft", spacing: "compact" },
    culture: { layout: "2", tone: "white", spacing: "normal" },
    benefits: { layout: "3", tone: "soft", spacing: "normal" },
    jobs: { layout: "grid", tone: "white", spacing: "normal" },
    cta: { layout: "row", tone: "brand", spacing: "compact" },
  },
  hero: { enabled: true },
  stats: {
    enabled: true,
    items: [
      {
        id: "openings",
        value: "12",
        auto: true,
        label: { vi: "Vị trí đang tuyển", en: "Open roles" },
      },
      {
        id: "people",
        value: "420+",
        label: { vi: "Nhân sự toàn hệ thống", en: "People on the team" },
      },
      { id: "offices", value: "3", label: { vi: "Văn phòng", en: "Offices" } },
      { id: "tenure", value: "3.4", label: { vi: "Thâm niên trung bình", en: "Average tenure" } },
    ],
  },
  culture: {
    enabled: true,
    eyebrow: { vi: "Văn hóa", en: "Culture" },
    title: {
      vi: "Bốn nguyên tắc định hình cách chúng tôi làm việc",
      en: "Four principles that shape how we work",
    },
    description: { ...empty },
    items: [
      {
        id: "clarity",
        icon: "compass",
        title: { vi: "Rõ ràng trước tốc độ", en: "Clarity before speed" },
        body: {
          vi: "Chúng tôi viết ra vấn đề trước khi bắt tay giải quyết, để mọi người cùng đi một hướng.",
          en: "We write the problem down before solving it, so everyone moves in one direction.",
        },
      },
      {
        id: "ownership",
        icon: "users",
        title: { vi: "Trách nhiệm cá nhân", en: "Personal ownership" },
        body: {
          vi: "Mỗi người có phạm vi rõ ràng và được tin tưởng để ra quyết định trong phạm vi đó.",
          en: "Everyone has a clear scope and the trust to make decisions inside it.",
        },
      },
      {
        id: "quality",
        icon: "sparkles",
        title: { vi: "Chất lượng thấy được", en: "Visible quality" },
        body: {
          vi: "Sản phẩm tốt là sản phẩm người dùng cảm nhận được sự chỉn chu trong từng chi tiết.",
          en: "Good products let users feel the care in every detail.",
        },
      },
      {
        id: "learning",
        icon: "graduation",
        title: { vi: "Học liên tục", en: "Always learning" },
        body: {
          vi: "Mỗi quý, mỗi đội dành thời gian nhìn lại và cải thiện cách làm việc của mình.",
          en: "Every quarter, each team steps back and improves how it works.",
        },
      },
    ],
  },
  benefits: {
    enabled: true,
    eyebrow: { vi: "Phúc lợi", en: "Benefits" },
    title: { vi: "Chăm lo cho bạn và gia đình", en: "Looking after you and your family" },
    description: { ...empty },
    items: [
      {
        id: "pay",
        icon: "wallet",
        title: { vi: "Thu nhập cạnh tranh", en: "Competitive pay" },
        body: {
          vi: "Lương tháng 13, thưởng hiệu suất theo quý và đánh giá lương hai lần mỗi năm.",
          en: "13th month salary, quarterly bonus and salary reviews twice a year.",
        },
      },
      {
        id: "health",
        icon: "heart",
        title: { vi: "Sức khỏe toàn diện", en: "Health cover" },
        body: {
          vi: "Bảo hiểm sức khỏe mở rộng cho bản thân và người thân, khám định kỳ hằng năm.",
          en: "Extended health insurance for you and your family, plus annual check-ups.",
        },
      },
      {
        id: "flexible",
        icon: "home",
        title: { vi: "Làm việc linh hoạt", en: "Flexible work" },
        body: {
          vi: "Hai ngày làm việc từ xa mỗi tuần và khung giờ bắt đầu linh hoạt.",
          en: "Two remote days each week and flexible start hours.",
        },
      },
    ],
  },
  jobs: {
    enabled: true,
    eyebrow: { vi: "Vị trí nổi bật", en: "Featured roles" },
    title: { vi: "Cơ hội đang mở", en: "Openings right now" },
    description: { ...empty },
    allLabel: { vi: "Xem tất cả vị trí", en: "See all roles" },
    count: 3,
  },
  cta: {
    enabled: true,
    title: { vi: "Không thấy vị trí phù hợp?", en: "Can't find the right role?" },
    body: {
      vi: "Gửi hồ sơ của bạn, đội ngũ tuyển dụng sẽ liên hệ khi có vị trí phù hợp.",
      en: "Send us your profile and our team will reach out when something fits.",
    },
    buttonLabel: { vi: "Gửi hồ sơ tự do", en: "Submit an open application" },
  },
};

export const defaultAbout: AboutConfig = {
  order: ["hero", "story", "timeline", "values", "leaders", "gallery", "contact"],
  styles: {
    hero: { layout: "left", tone: "brand", spacing: "spacious" },
    story: { layout: "image-right", tone: "white", spacing: "normal" },
    timeline: { layout: "grid", tone: "soft", spacing: "normal" },
    values: { layout: "4", tone: "white", spacing: "normal" },
    leaders: { layout: "4", tone: "soft", spacing: "normal" },
    gallery: { layout: "featured", tone: "white", spacing: "normal" },
    contact: { layout: "grid", tone: "soft", spacing: "normal" },
  },
  hero: {
    enabled: true,
    eyebrow: { vi: "Về chúng tôi", en: "About us" },
    title: {
      vi: "Chúng tôi xây dựng nơi làm việc mà người giỏi muốn ở lại",
      en: "We build a workplace great people want to stay in",
    },
    subtitle: {
      vi: "Mười năm đồng hành cùng doanh nghiệp Việt Nam trong hành trình tìm và giữ người tài.",
      en: "Ten years helping Vietnamese companies find and keep great people.",
    },
    image: defaultMedia.aboutCover,
    stats: [
      { id: "founded", value: "2016", label: { vi: "Năm thành lập", en: "Founded" } },
      { id: "people", value: "420+", label: { vi: "Đồng nghiệp", en: "Colleagues" } },
      { id: "offices", value: "3", label: { vi: "Văn phòng", en: "Offices" } },
      { id: "clients", value: "1.200+", label: { vi: "Doanh nghiệp đồng hành", en: "Companies served" } },
    ],
  },
  story: {
    enabled: true,
    title: { vi: "Câu chuyện của chúng tôi", en: "Our story" },
    paragraphs: [
      {
        vi: "TalentHub bắt đầu năm 2016 với sáu người trong một căn phòng nhỏ ở Hà Nội và một câu hỏi đơn giản: làm sao để doanh nghiệp Việt Nam tuyển đúng người nhanh hơn.",
        en: "TalentHub started in 2016 with six people in a small room in Hanoi and one simple question: how can Vietnamese companies hire the right people faster.",
      },
      {
        vi: "Mười năm sau, chúng tôi có hơn 400 đồng nghiệp tại ba thành phố, phục vụ hơn 1.200 doanh nghiệp và vẫn giữ cách làm việc gọn gàng như ngày đầu.",
        en: "Ten years later we are more than 400 colleagues across three cities, serving over 1,200 companies, still working with the same lean habits.",
      },
    ],
    image: defaultMedia.aboutStory,
  },
  timeline: {
    enabled: true,
    title: { vi: "Những cột mốc", en: "Milestones" },
    items: [
      {
        id: "m-2016",
        year: "2016",
        title: { vi: "Những ngày đầu", en: "The beginning" },
        body: { vi: "Sáu người, một văn phòng nhỏ tại Hà Nội.", en: "Six people in a small Hanoi office." },
      },
      {
        id: "m-2019",
        year: "2019",
        title: { vi: "Mở rộng miền Nam", en: "Heading south" },
        body: {
          vi: "Khai trương văn phòng TP. Hồ Chí Minh, đội ngũ vượt 100 người.",
          en: "Ho Chi Minh City office opens; the team passes 100 people.",
        },
      },
      {
        id: "m-2022",
        year: "2022",
        title: { vi: "Nền tảng tuyển dụng", en: "Our hiring platform" },
        body: {
          vi: "Ra mắt nền tảng quản lý tuyển dụng phục vụ hơn 500 doanh nghiệp.",
          en: "We launch the hiring platform now used by 500+ companies.",
        },
      },
      {
        id: "m-2026",
        year: "2026",
        title: { vi: "Ba thành phố", en: "Three cities" },
        body: {
          vi: "420 đồng nghiệp tại Hà Nội, Đà Nẵng và TP. Hồ Chí Minh.",
          en: "420 colleagues across Hanoi, Da Nang and Ho Chi Minh City.",
        },
      },
    ],
  },
  values: {
    enabled: true,
    title: { vi: "Điều chúng tôi tin", en: "What we believe" },
    description: {
      vi: "Bốn nguyên tắc định hình cách chúng tôi làm việc mỗi ngày.",
      en: "Four principles that shape how we work every day.",
    },
    items: [
      {
        id: "v-clarity",
        icon: "compass",
        title: { vi: "Rõ ràng trước tốc độ", en: "Clarity before speed" },
        body: {
          vi: "Chúng tôi viết ra vấn đề trước khi bắt tay giải quyết.",
          en: "We write the problem down before solving it.",
        },
      },
      {
        id: "v-ownership",
        icon: "users",
        title: { vi: "Trách nhiệm cá nhân", en: "Personal ownership" },
        body: {
          vi: "Mỗi người có phạm vi rõ ràng và được tin tưởng để quyết định.",
          en: "Everyone has a clear scope and the trust to decide.",
        },
      },
      {
        id: "v-quality",
        icon: "sparkles",
        title: { vi: "Chất lượng thấy được", en: "Visible quality" },
        body: {
          vi: "Người dùng cảm nhận được sự chỉn chu trong từng chi tiết.",
          en: "Users can feel the care in every detail.",
        },
      },
      {
        id: "v-learning",
        icon: "graduation",
        title: { vi: "Học liên tục", en: "Always learning" },
        body: {
          vi: "Mỗi quý, mỗi đội nhìn lại và cải thiện cách làm việc.",
          en: "Each quarter every team reviews and improves how it works.",
        },
      },
    ],
  },
  leaders: {
    enabled: true,
    title: { vi: "Đội ngũ dẫn dắt", en: "Leadership team" },
    items: [
      { id: "l-1", name: "Trần Thu Hà", role: { vi: "Tổng giám đốc", en: "Chief Executive Officer" }, photo: "" },
      { id: "l-2", name: "Phạm Đức Long", role: { vi: "Giám đốc Công nghệ", en: "Chief Technology Officer" }, photo: "" },
      { id: "l-3", name: "Đỗ Thanh Mai", role: { vi: "Giám đốc Nhân sự", en: "Chief People Officer" }, photo: "" },
      { id: "l-4", name: "Lý Quang Vinh", role: { vi: "Giám đốc Sản phẩm", en: "Chief Product Officer" }, photo: "" },
    ],
  },
  gallery: {
    enabled: true,
    title: { vi: "Một ngày ở TalentHub", en: "A day at TalentHub" },
    items: [
      {
        id: "g-1",
        url: defaultMedia.aboutGallery1,
        caption: { vi: "Phác thảo sản phẩm cùng nhau", en: "Sketching products together" },
      },
      {
        id: "g-2",
        url: defaultMedia.aboutGallery2,
        caption: { vi: "Góc cà phê buổi sáng", en: "Morning coffee corner" },
      },
      {
        id: "g-3",
        url: defaultMedia.aboutGallery3,
        caption: { vi: "Buổi chia sẻ nội bộ", en: "Internal sharing session" },
      },
      {
        id: "g-4",
        url: defaultMedia.aboutGallery4,
        caption: { vi: "Không gian tập trung", en: "Focus space" },
      },
    ],
  },
  contact: { enabled: true },
};



export const defaultSiteConfig: SiteConfig = {
  layout: "classic",
  paletteId: "navy",
  primary: palettePresets[0]!.primary,
  accent: palettePresets[0]!.accent,
  surfaceTone: "tinted",
  images: {
    hero: defaultMedia.hero,
    heroImages: [
      defaultMedia.hero,
      defaultMedia.heroTeam,
      defaultMedia.heroDark,
      defaultMedia.heroLounge,
      defaultMedia.heroWorkshop,
    ],
    culture: defaultMedia.culture,
    logo: defaultMedia.logo,
  },
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
  sections: structuredClone(defaultSections),
  company: structuredClone(defaultCompany),
  about: structuredClone(defaultAbout),

  jobsPage: structuredClone(defaultJobsPage),
  modules: { news: true, openApplication: true },
};

function hexToRgb(hex: string): [number, number, number] | null {
  const value = hex.trim().replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Returns a readable foreground colour (near-white or near-black) for a hex background. */
export function readableOn(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.42 ? "#16181d" : "#ffffff";
}

export function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/* ---------------- Colour engine: derive a full token set from 2 brand colours -------------- */

type Oklch = { l: number; c: number; h: number };

function srgbToLinear(v: number) {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Converts a hex colour to OKLCH. Falls back to a neutral dark tone on bad input. */
export function hexToOklch(hex: string): Oklch {
  const rgb = hexToRgb(hex);
  if (!rgb) return { l: 0.28, c: 0.04, h: 258 };
  const [r, g, b] = rgb.map(srgbToLinear) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.sqrt(A * A + B * B);
  const h = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

function oklch(l: number, c: number, h: number, alpha?: string) {
  const L = Math.min(1, Math.max(0, l)).toFixed(4);
  const C = Math.max(0, c).toFixed(4);
  const H = h.toFixed(2);
  return alpha === undefined ? `oklch(${L} ${C} ${H})` : `oklch(${L} ${C} ${H} / ${alpha})`;
}

function relLuminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(srgbToLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours (1–21). */
export function contrastRatio(a: string, b: string) {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type SurfaceTone = "white" | "tinted" | "soft";

const toneBackground: Record<SurfaceTone, { l: number; c: number }> = {
  white: { l: 1, c: 0 },
  tinted: { l: 0.993, c: 0.004 },
  soft: { l: 0.978, c: 0.01 },
};

/** Builds the full light + dark token set from the brand primary/accent pair. */
function buildPaletteCss(config: SiteConfig): string {
  const p = hexToOklch(config.primary);
  const a = hexToOklch(config.accent);
  const hue = p.h;
  // Keep tints subtle: neutral surfaces borrow the hue but only a sliver of chroma.
  const tint = Math.min(p.c, 0.06);
  const tone = toneBackground[config.surfaceTone] ?? toneBackground.white;

  // Primary must stay dark enough for white-ish text on buttons and the hero band.
  const primaryL = Math.min(p.l, 0.62);
  const primaryFg =
    readableOn(config.primary) === "#ffffff" ? oklch(0.985, 0.004, hue) : oklch(0.2, 0.02, hue);
  const accentFg =
    readableOn(config.accent) === "#ffffff" ? oklch(0.985, 0.004, a.h) : oklch(0.24, 0.03, a.h);

  const light = [
    `--background: ${oklch(tone.l, tone.c, hue)}`,
    `--foreground: ${oklch(0.24, tint * 0.65, hue)}`,
    `--surface: ${oklch(Math.min(tone.l - 0.022, 0.972), tint * 0.16, hue)}`,
    `--card: ${oklch(1, 0, hue)}`,
    `--card-foreground: ${oklch(0.24, tint * 0.65, hue)}`,
    `--popover: ${oklch(1, 0, hue)}`,
    `--popover-foreground: ${oklch(0.24, tint * 0.65, hue)}`,
    `--primary: ${oklch(primaryL, p.c, hue)}`,
    `--primary-foreground: ${primaryFg}`,
    `--secondary: ${oklch(0.93, tint * 0.22, hue)}`,
    `--secondary-foreground: ${oklch(Math.min(primaryL, 0.32), p.c * 0.9, hue)}`,
    `--muted: ${oklch(0.963, tint * 0.12, hue)}`,
    `--muted-foreground: ${oklch(0.52, tint * 0.45, hue)}`,
    `--accent: ${oklch(a.l, a.c, a.h)}`,
    `--accent-foreground: ${accentFg}`,
    `--border: ${oklch(0.906, tint * 0.17, hue)}`,
    `--input: ${oklch(0.895, tint * 0.2, hue)}`,
    `--ring: ${oklch(a.l, a.c, a.h)}`,
    `--chart-1: ${oklch(primaryL, p.c, hue)}`,
    `--chart-2: ${oklch(a.l, a.c, a.h)}`,
    `--chart-3: ${oklch(Math.min(primaryL + 0.18, 0.72), p.c * 0.8, hue)}`,
    `--sidebar: ${oklch(Math.min(primaryL, 0.3), p.c, hue)}`,
    `--sidebar-foreground: ${oklch(0.94, 0.008, hue)}`,
    `--sidebar-primary: ${oklch(a.l, a.c, a.h)}`,
    `--sidebar-primary-foreground: ${accentFg}`,
    `--sidebar-accent: ${oklch(Math.min(primaryL + 0.07, 0.38), p.c, hue)}`,
    `--sidebar-accent-foreground: ${oklch(0.97, 0.006, hue)}`,
    `--sidebar-border: oklch(1 0 0 / 12%)`,
    `--sidebar-ring: ${oklch(a.l, a.c, a.h)}`,
    `--elevation-soft: 0 1px 2px ${oklch(0.24, tint, hue, "6%")}, 0 1px 3px ${oklch(0.24, tint, hue, "4%")}`,
    `--elevation-lift: 0 2px 4px ${oklch(0.24, tint, hue, "5%")}, 0 10px 24px -8px ${oklch(0.24, tint, hue, "14%")}`,
    `--elevation-deep: 0 24px 60px -24px ${oklch(0.24, tint, hue, "34%")}`,
    `--gradient-hero: linear-gradient(135deg, ${oklch(Math.min(primaryL, 0.3), p.c, hue)} 0%, ${oklch(Math.min(primaryL + 0.08, 0.42), p.c * 0.95, hue - 6)} 55%, ${oklch(Math.min(primaryL + 0.16, 0.5), p.c * 0.85, hue - 14)} 100%)`,
  ].join(";\n  ");

  const darkPrimaryL = 0.9;
  const dark = [
    `--background: ${oklch(0.17, tint * 0.35, hue)}`,
    `--foreground: ${oklch(0.96, 0.006, hue)}`,
    `--surface: ${oklch(0.21, tint * 0.4, hue)}`,
    `--card: ${oklch(0.22, tint * 0.42, hue)}`,
    `--card-foreground: ${oklch(0.96, 0.006, hue)}`,
    `--popover: ${oklch(0.22, tint * 0.42, hue)}`,
    `--popover-foreground: ${oklch(0.96, 0.006, hue)}`,
    `--primary: ${oklch(darkPrimaryL, Math.min(p.c * 0.35, 0.05), hue)}`,
    `--primary-foreground: ${oklch(0.2, tint * 0.5, hue)}`,
    `--secondary: ${oklch(0.27, tint * 0.45, hue)}`,
    `--secondary-foreground: ${oklch(0.96, 0.006, hue)}`,
    `--muted: ${oklch(0.27, tint * 0.4, hue)}`,
    `--muted-foreground: ${oklch(0.74, tint * 0.3, hue)}`,
    `--accent: ${oklch(Math.max(a.l, 0.72), a.c, a.h)}`,
    `--accent-foreground: ${oklch(0.2, 0.03, a.h)}`,
    `--border: oklch(1 0 0 / 11%)`,
    `--input: oklch(1 0 0 / 16%)`,
    `--ring: ${oklch(Math.max(a.l, 0.72), a.c, a.h)}`,
    `--chart-1: ${oklch(0.84, 0.03, hue)}`,
    `--chart-2: ${oklch(Math.max(a.l, 0.72), a.c, a.h)}`,
    `--sidebar: ${oklch(0.2, tint * 0.5, hue)}`,
    `--sidebar-foreground: ${oklch(0.94, 0.008, hue)}`,
    `--sidebar-primary: ${oklch(Math.max(a.l, 0.72), a.c, a.h)}`,
    `--sidebar-primary-foreground: ${oklch(0.2, 0.03, a.h)}`,
    `--sidebar-accent: ${oklch(0.28, tint * 0.5, hue)}`,
    `--sidebar-accent-foreground: ${oklch(0.97, 0.006, hue)}`,
    `--gradient-hero: linear-gradient(135deg, ${oklch(0.24, p.c * 0.7, hue)} 0%, ${oklch(0.3, p.c * 0.6, hue - 6)} 55%, ${oklch(0.36, p.c * 0.5, hue - 14)} 100%)`,
  ].join(";\n  ");

  return `:root {\n  ${light};\n}\n.dark {\n  ${dark};\n}\n`;
}

const STYLE_ID = "brand-palette";

function applyPalette(config: SiteConfig) {
  if (typeof document === "undefined") return;
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = buildPaletteCss(config);
}

function isConfigLike(value: unknown): value is SiteConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<SiteConfig>;
  return (
    typeof v.layout === "string" &&
    typeof v.primary === "string" &&
    typeof v.accent === "string" &&
    !!v.images &&
    !!v.copy
  );
}

/** Hero slideshow images, upgrading saves that only had a single hero image. */
function heroList(images: Partial<SiteConfig["images"]> | undefined): string[] {
  const list = Array.isArray(images?.heroImages)
    ? images.heroImages.filter((url): url is string => typeof url === "string" && url.length > 0)
    : [];
  if (list.length) return list.slice(0, 5);
  return [images?.hero ?? defaultSiteConfig.images.hero];
}

/** Merges a stored config with defaults so older saves never miss new fields. */
function mergeConfig(stored: SiteConfig): SiteConfig {
  const s = (stored.sections ?? {}) as Partial<SiteSections>;
  const d = defaultSections;
  return {
    ...defaultSiteConfig,
    ...stored,
    surfaceTone: stored.surfaceTone ?? defaultSiteConfig.surfaceTone,
    images: {
      ...defaultSiteConfig.images,
      ...stored.images,
      heroImages: heroList(stored.images),
    },
    copy: { ...defaultSiteConfig.copy, ...stored.copy },
    sections: (() => {
      const storedOrder = Array.isArray(s.order)
        ? s.order.filter((key): key is HomeWidgetKey =>
            homeWidgetKeys.includes(key as HomeWidgetKey),
          )
        : [];
      const order = [...storedOrder, ...homeWidgetKeys.filter((key) => !storedOrder.includes(key))];
      return {
        order,
        styles: Object.fromEntries(
          homeWidgetKeys.map((key) => [key, { ...d.styles[key], ...(s.styles?.[key] ?? {}) }]),
        ) as SiteSections["styles"],
        hero: { ...d.hero, ...(s.hero ?? {}) },
        stats: { ...d.stats, ...s.stats },
        culture: { ...d.culture, ...s.culture },
        benefits: { ...d.benefits, ...s.benefits },
        jobs: { ...d.jobs, ...s.jobs },
        cta: { ...d.cta, ...s.cta },
      };
    })(),
    company: {
      ...defaultCompany,
      ...(stored.company ?? {}),
      social: { ...defaultCompany.social, ...(stored.company?.social ?? {}) },
      locations: stored.company?.locations ?? defaultCompany.locations,
    },
    about: (() => {
      const a = (stored.about ?? {}) as Partial<AboutConfig>;
      const da = defaultAbout;
      const validKeys = da.order;
      const storedOrder = Array.isArray(a.order)
        ? a.order.filter((key): key is AboutWidgetKey => validKeys.includes(key as AboutWidgetKey))
        : [];
      const order = [...storedOrder, ...validKeys.filter((key) => !storedOrder.includes(key))];
      return {
        order,
        styles: Object.fromEntries(
          validKeys.map((key) => [key, { ...da.styles[key], ...(a.styles?.[key] ?? {}) }]),
        ) as AboutConfig["styles"],
        hero: { ...da.hero, ...(a.hero ?? {}) },
        story: { ...da.story, ...(a.story ?? {}) },
        timeline: { ...da.timeline, ...(a.timeline ?? {}) },
        values: { ...da.values, ...(a.values ?? {}) },
        leaders: { ...da.leaders, ...(a.leaders ?? {}) },
        gallery: { ...da.gallery, ...(a.gallery ?? {}) },
        contact: { ...da.contact, ...(a.contact ?? {}) },
      };
    })(),

    jobsPage: {
      ...defaultJobsPage,
      ...(stored.jobsPage ?? {}),
      filters: { ...defaultJobsPage.filters, ...(stored.jobsPage?.filters ?? {}) },
      card: { ...defaultJobsPage.card, ...(stored.jobsPage?.card ?? {}) },
      title: { ...defaultJobsPage.title, ...(stored.jobsPage?.title ?? {}) },
      subtitle: { ...defaultJobsPage.subtitle, ...(stored.jobsPage?.subtitle ?? {}) },
    },
    modules: { ...defaultSiteConfig.modules, ...(stored.modules ?? {}) },
  };
}

type SiteConfigValue = {
  config: SiteConfig;
  save: (next: SiteConfig) => boolean;
  reset: () => void;
};

const SiteConfigContext = createContext<SiteConfigValue | null>(null);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (isConfigLike(parsed)) {
        setConfig(mergeConfig(parsed));
      }
    } catch {
      /* ignore malformed stored config */
    }
  }, []);

  useEffect(() => {
    applyPalette(config);
  }, [config]);

  const save = useCallback((next: SiteConfig) => {
    setConfig(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setConfig(defaultSiteConfig);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<SiteConfigValue>(() => ({ config, save, reset }), [config, save, reset]);

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

/** Read-only fallback so a stale module instance never blanks the screen. */
const fallbackValue: SiteConfigValue = {
  config: defaultSiteConfig,
  save: () => false,
  reset: () => {},
};

export function useSiteConfig() {
  const ctx = useContext(SiteConfigContext);
  return ctx ?? fallbackValue;
}
