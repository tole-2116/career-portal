import { createFileRoute } from "@tanstack/react-router";
import type { ComponentType } from "react";


import { HomeBento } from "@/components/home/HomeBento";
import { HomeClassic } from "@/components/home/HomeClassic";
import { HomeEditorial } from "@/components/home/HomeEditorial";
import { HomeSpotlight } from "@/components/home/HomeSpotlight";
import { HomeSplit } from "@/components/home/HomeSplit";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSiteConfig, type LayoutId } from "@/lib/site-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TalentHub — Cơ hội nghề nghiệp | Careers" },
      {
        name: "description",
        content:
          "Khám phá vị trí đang tuyển, văn hóa làm việc và phúc lợi tại TalentHub. Ứng tuyển trực tuyến chỉ trong vài phút.",
      },
      { property: "og:title", content: "TalentHub — Cơ hội nghề nghiệp | Careers" },
      {
        property: "og:description",
        content: "Khám phá vị trí đang tuyển, văn hóa làm việc và phúc lợi tại TalentHub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const layouts: Record<LayoutId, ComponentType> = {
  classic: HomeClassic,
  split: HomeSplit,
  bento: HomeBento,
  editorial: HomeEditorial,
  spotlight: HomeSpotlight,
};

function HomePage() {
  const { config } = useSiteConfig();
  const Layout = layouts[config.layout] ?? HomeClassic;

  return (
    <SiteLayout>
      <Layout />
    </SiteLayout>
  );
}
