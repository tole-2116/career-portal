import { Link } from "@tanstack/react-router";
import {
  Facebook,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Youtube,
} from "lucide-react";

import { BrandMark } from "@/components/site/BrandMark";
import { useI18n } from "@/lib/i18n";
import { useSiteConfig } from "@/lib/site-config";

export function SiteFooter() {
  const { t, tr } = useI18n();
  const { config } = useSiteConfig();
  const company = config.company;
  const brand = tr(config.copy.brand);

  const socials = [
    { href: company.social.facebook, Icon: Facebook, label: "Facebook" },
    { href: company.social.linkedin, Icon: Linkedin, label: "LinkedIn" },
    { href: company.social.youtube, Icon: Youtube, label: "YouTube" },
    { href: company.social.github, Icon: Github, label: "GitHub" },
    { href: company.social.zalo ?? "", Icon: MessageCircle, label: "Zalo" },
    { href: company.social.tiktok ?? "", Icon: Music2, label: "TikTok" },
  ].filter((item) => item.href.trim().length > 0);

  const locations = company.locations.filter((loc) => tr(loc.address).trim().length > 0);
  const intro = tr(company.intro).trim() || tr(config.copy.tagline);
  const copyright =
    tr(company.copyright).trim() || `© ${new Date().getFullYear()} ${brand}. ${t("footer.rights")}`;

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <BrandMark size={34} />
            <p className="font-display text-lg font-semibold">{brand}</p>
          </div>
          {intro && (
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{intro}</p>
          )}
          {socials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="font-display text-sm font-semibold">{t("footer.links")}</p>
          <div className="mt-4 flex flex-col gap-2.5 text-sm">
            <Link to="/about" className="w-fit text-muted-foreground hover:text-accent">
              {t("nav.about")}
            </Link>
            <Link to="/jobs" className="w-fit text-muted-foreground hover:text-accent">
              {t("nav.jobs")}
            </Link>
            {config.modules.news && (
              <Link to="/news" className="w-fit text-muted-foreground hover:text-accent">
                {t("nav.news")}
              </Link>
            )}
            <Link to="/contact" className="w-fit text-muted-foreground hover:text-accent">
              {t("nav.contact")}
            </Link>
            <Link to="/admin" className="w-fit text-muted-foreground hover:text-accent">
              {t("nav.admin")}
            </Link>
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-display text-sm font-semibold">{t("footer.contact")}</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            {locations.map((loc) => (
              <p key={loc.id} className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="min-w-0">{tr(loc.address)}</span>
              </p>
            ))}
            {company.email.trim() && (
              <a
                href={`mailto:${company.email}`}
                className="flex items-center gap-2.5 hover:text-accent"
              >
                <Mail className="h-4 w-4 shrink-0 text-accent" />
                <span className="truncate">{company.email}</span>
              </a>
            )}
            {company.phone.trim() && (
              <a
                href={`tel:${company.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2.5 hover:text-accent"
              >
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                <span>{company.phone}</span>
              </a>
            )}
            {company.website.trim() && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-2.5 hover:text-accent"
              >
                <Globe className="h-4 w-4 shrink-0 text-accent" />
                <span className="truncate">{company.website}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <span>{copyright}</span>
          {(company.legalName.trim() || company.taxId.trim()) && (
            <span>
              {[company.legalName.trim(), company.taxId.trim()].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
