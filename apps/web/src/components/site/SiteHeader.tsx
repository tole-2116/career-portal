import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

import { PublicLanguageSwitch } from "@/components/PublicLanguageSwitch";
import { BrandMark } from "@/components/site/BrandMark";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useSiteConfig } from "@/lib/site-config";

const baseLinks = [{ to: "/", key: "nav.home" }] as const;

const aboutLink = { to: "/about", key: "nav.about" } as const;
const newsLink = { to: "/news", key: "nav.news" } as const;
const recruitmentLink = { to: "/recruitment-process", key: "nav.recruitmentProcess" } as const;
const guideLink = { to: "/recruitment-guide", key: "nav.recruitmentGuide" } as const;
const contactLink = { to: "/contact", key: "nav.contact" } as const;

export function SiteHeader() {
  const { t, tr } = useI18n();
  const { config } = useSiteConfig();
  const [open, setOpen] = useState(false);
  const [mobileCareerOpen, setMobileCareerOpen] = useState(false);
  const links = [
    baseLinks[0],
    aboutLink,
    ...(config.modules.news ? [newsLink] : []),
    contactLink,
  ];
  const careerLinks = [
    { to: "/jobs", key: "nav.jobs" },
    ...(config.modules.recruitmentProcess ? [recruitmentLink] : []),
    ...(config.modules.recruitmentGuide ? [guideLink] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label={tr(config.copy.brand)}>
          <BrandMark size={40} />
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-semibold tracking-tight">
              {tr(config.copy.brand)}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {tr(config.copy.tagline)}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="mr-1 hidden items-center gap-1 rounded-full border border-border bg-card/70 p-1 md:flex">
            {links.slice(0, 1).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: true }}
                activeProps={{ className: "bg-secondary text-foreground" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors hover:text-foreground"
              >
                {t(link.key)}
              </Link>
            ))}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-auto rounded-full px-4 py-1.5 text-muted-foreground transition-colors duration-200 hover:text-foreground data-[state=open]:bg-secondary data-[state=open]:text-foreground motion-reduce:transition-none">
                    {t("nav.jobs")}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="min-w-64 overflow-hidden rounded-2xl border border-border/80 bg-popover/95 p-2 text-popover-foreground shadow-xl shadow-black/10 backdrop-blur-xl motion-reduce:animate-none">
                    <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {t("nav.jobs")}
                    </div>
                    <div className="space-y-1">
                      {careerLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 outline-none transition-[background-color,color,transform] duration-200 ease-out hover:translate-x-0.5 hover:bg-secondary hover:text-foreground focus-visible:bg-secondary focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none motion-reduce:transition-none"
                        >
                          {t(link.key)}
                          <span aria-hidden="true" className="text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">→</span>
                        </Link>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            {links.slice(1).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: link.to === "/" }}
                activeProps={{ className: "bg-secondary text-foreground" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors hover:text-foreground"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <PublicLanguageSwitch />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/jobs">{t("nav.apply")}</Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => {
              setOpen((v) => {
                if (v) setMobileCareerOpen(false);
                return !v;
              });
            }}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 py-2 md:hidden">
          {links.slice(0, 1).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {t(link.key)}
            </Link>
          ))}
          <button
            type="button"
            aria-expanded={mobileCareerOpen}
            onClick={() => setMobileCareerOpen((value) => !value)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {t("nav.jobs")}
            <ChevronDown className={`h-4 w-4 transition-transform ${mobileCareerOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {mobileCareerOpen && (
            <div className="pl-3">
              {careerLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => {
                    setOpen(false);
                    setMobileCareerOpen(false);
                  }}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {t(link.key)}
                </Link>
              ))}
            </div>
          )}
          {links.slice(1).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {t(link.key)}
            </Link>
          ))}
          <Link
            to="/jobs"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {t("nav.apply")}
          </Link>
        </nav>
      )}
    </header>
  );
}
