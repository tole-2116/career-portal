import { createFileRoute } from "@tanstack/react-router";
import type { ComponentType } from "react";

import { HomeBento } from "@/components/home/HomeBento";
import { HomeClassic } from "@/components/home/HomeClassic";
import { HomeEditorial } from "@/components/home/HomeEditorial";
import { HomeSpotlight } from "@/components/home/HomeSpotlight";
import { HomeSplit } from "@/components/home/HomeSplit";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSiteConfig, type LayoutId } from "@/lib/site-config";
import { createRouteMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/")({
  head: createRouteMeta({
    titleKey: "page.home.title",
    descriptionKey: "page.home.description",
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
