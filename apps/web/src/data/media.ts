import type { Localized } from "@/lib/i18n";

import brandLogo from "@/assets/brand-logo.png";
import cultureLounge from "@/assets/culture-lounge.jpg";
import cultureWorkshop from "@/assets/culture-workshop.jpg";
import heroDark from "@/assets/hero-dark.jpg";
import heroOffice from "@/assets/hero-office.jpg";
import heroTeam from "@/assets/hero-team.jpg";
import logoBadge from "@/assets/logo-badge.png";
import logoCircle from "@/assets/logo-circle.png";
import logoMonogram from "@/assets/logo-monogram.png";
import photoEvening from "@/assets/hero-03-evening.jpg";
import photoLounge from "@/assets/hero-04-lounge.jpg";
import photoOffice from "@/assets/hero-01-office.jpg";
import photoTeam from "@/assets/hero-02-team.jpg";
import photoWorkshop from "@/assets/hero-05-workshop.jpg";
import aboutCover from "@/assets/about-cover.jpg";
import aboutGallery1 from "@/assets/about-gallery-1.jpg";
import aboutGallery2 from "@/assets/about-gallery-2.jpg";
import aboutGallery3 from "@/assets/about-gallery-3.jpg";
import aboutGallery4 from "@/assets/about-gallery-4.jpg";
import aboutStory from "@/assets/about-story.jpg";

export type MediaItem = {
  id: string;
  label: Localized;
  url: string;
};

export const heroLibrary: MediaItem[] = [
  {
    id: "photo-office",
    label: { vi: "Văn phòng trụ sở", en: "Head office" },
    url: photoOffice,
  },
  {
    id: "photo-team",
    label: { vi: "Đội ngũ họp chiến lược", en: "Team strategy meeting" },
    url: photoTeam,
  },
  {
    id: "photo-evening",
    label: { vi: "Văn phòng buổi tối", en: "Office at dusk" },
    url: photoEvening,
  },
  {
    id: "photo-lounge",
    label: { vi: "Khu thư giãn", en: "Office lounge" },
    url: photoLounge,
  },
  {
    id: "photo-workshop",
    label: { vi: "Buổi chia sẻ nội bộ", en: "Internal sharing session" },
    url: photoWorkshop,
  },
  {
    id: "hero-office",
    label: { vi: "Văn phòng sáng", en: "Bright office" },
    url: heroOffice,
  },
  {
    id: "hero-team",
    label: { vi: "Đội ngũ họp nhóm", en: "Team meeting" },
    url: heroTeam,
  },
  {
    id: "hero-dark",
    label: { vi: "Không gian làm việc tối", en: "Dark workspace" },
    url: heroDark,
  },
];

export const cultureLibrary: MediaItem[] = [
  {
    id: "photo-lounge",
    label: { vi: "Khu thư giãn", en: "Office lounge" },
    url: photoLounge,
  },
  {
    id: "photo-workshop",
    label: { vi: "Buổi chia sẻ nội bộ", en: "Internal sharing session" },
    url: photoWorkshop,
  },
  {
    id: "photo-team",
    label: { vi: "Đội ngũ họp chiến lược", en: "Team strategy meeting" },
    url: photoTeam,
  },
  {
    id: "culture-lounge",
    label: { vi: "Khu nghỉ ngơi", en: "Break area" },
    url: cultureLounge,
  },
  {
    id: "culture-workshop",
    label: { vi: "Buổi workshop", en: "Team workshop" },
    url: cultureWorkshop,
  },
  {
    id: "culture-team",
    label: { vi: "Họp nhóm", en: "Team meeting" },
    url: heroTeam,
  },
];

export const logoLibrary: MediaItem[] = [
  {
    id: "brand-logo",
    label: { vi: "Biểu tượng mặc định", en: "Default mark" },
    url: brandLogo,
  },
  {
    id: "logo-monogram",
    label: { vi: "Chữ lồng hình học", en: "Geometric monogram" },
    url: logoMonogram,
  },
  {
    id: "logo-badge",
    label: { vi: "Huy hiệu mũi tên", en: "Arrow badge" },
    url: logoBadge,
  },
  {
    id: "logo-circle",
    label: { vi: "Vòng tròn kết nối", en: "Connected circle" },
    url: logoCircle,
  },
];

export const aboutLibrary: MediaItem[] = [
  { id: "about-cover", label: { vi: "Ảnh bìa văn phòng", en: "Office cover" }, url: aboutCover },
  { id: "about-story", label: { vi: "Đội ngũ trao đổi", en: "Team discussion" }, url: aboutStory },
  { id: "about-g1", label: { vi: "Phác thảo sản phẩm", en: "Product sketching" }, url: aboutGallery1 },
  { id: "about-g2", label: { vi: "Góc cà phê", en: "Coffee corner" }, url: aboutGallery2 },
  { id: "about-g3", label: { vi: "Chia sẻ nội bộ", en: "Internal session" }, url: aboutGallery3 },
  { id: "about-g4", label: { vi: "Không gian tập trung", en: "Focus space" }, url: aboutGallery4 },
  { id: "photo-office", label: { vi: "Văn phòng trụ sở", en: "Head office" }, url: photoOffice },
  { id: "photo-team", label: { vi: "Đội ngũ họp chiến lược", en: "Team strategy meeting" }, url: photoTeam },
  { id: "photo-evening", label: { vi: "Văn phòng buổi tối", en: "Office at dusk" }, url: photoEvening },
  { id: "photo-lounge", label: { vi: "Khu thư giãn", en: "Office lounge" }, url: photoLounge },
  { id: "photo-workshop", label: { vi: "Buổi chia sẻ nội bộ", en: "Sharing session" }, url: photoWorkshop },
];

export const defaultMedia = {
  hero: photoOffice,
  heroTeam: photoTeam,
  heroDark: photoEvening,
  heroLounge: photoLounge,
  heroWorkshop: photoWorkshop,
  culture: photoLounge,
  logo: brandLogo,
  aboutCover,
  aboutStory,
  aboutGallery1,
  aboutGallery2,
  aboutGallery3,
  aboutGallery4,
};

