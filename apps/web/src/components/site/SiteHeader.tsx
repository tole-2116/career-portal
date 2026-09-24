import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { PublicLanguageSwitch } from "@/components/PublicLanguageSwitch";
import { BrandMark } from "@/components/site/BrandMark";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useSiteConfig } from "@/lib/site-config";

const baseLinks = [
  { to: "/", key: "nav.home" },
  { to: "/jobs", key: "nav.jobs" },
  { to: "/about", key: "nav.about" },
] as const;

const newsLink = { to: "/news", key: "nav.news" } as const;
const contactLink = { to: "/contact", key: "nav.contact" } as const;

export function SiteHeader() {
  const { t, tr } = useI18n();
  const { config } = useSiteConfig();
  const [open, setOpen] = useState(false);
  const links = config.modules.news
    ? [...baseLinks, newsLink, contactLink]
    : [...baseLinks, contactLink];

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
            {links.map((link) => (
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
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 py-2 md:hidden">
          {[...links, { to: "/jobs", key: "nav.apply" } as const].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
