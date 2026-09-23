import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  Briefcase,
  FormInput,
  LayoutDashboard,
  ListTree,
  LogOut,
  Newspaper,
  Palette,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { LanguageToggle } from "@/components/LanguageToggle";
import { BrandMark } from "@/components/site/BrandMark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { canAccess, sectionForPath, type AdminSection } from "@/lib/permissions";
import { useSiteConfig } from "@/lib/site-config";

const navItems = [
  { to: "/admin", key: "admin.nav.overview", icon: LayoutDashboard, exact: true, section: "overview" },
  { to: "/admin/jobs", key: "admin.nav.jobs", icon: Briefcase, exact: false, section: "jobs" },
  {
    to: "/admin/candidates",
    key: "admin.nav.candidates",
    icon: Users,
    exact: false,
    section: "candidates",
  },
  { to: "/admin/news", key: "admin.nav.news", icon: Newspaper, exact: false, section: "news" },
  { to: "/admin/forms", key: "admin.nav.forms", icon: FormInput, exact: false, section: "forms" },
  {
    to: "/admin/taxonomies",
    key: "admin.nav.taxonomies",
    icon: ListTree,
    exact: false,
    section: "taxonomies",
  },
  {
    to: "/admin/settings",
    key: "admin.nav.settings",
    icon: Palette,
    exact: false,
    section: "settings",
  },
  { to: "/admin/users", key: "admin.nav.users", icon: ShieldCheck, exact: false, section: "users" },
] as const satisfies ReadonlyArray<{
  to: string;
  key: TranslationKey;
  icon: typeof Users;
  exact: boolean;
  section: AdminSection;
}>;

export function AdminLayout({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { t, tr } = useI18n();
  const { config } = useSiteConfig();
  const { currentUser, ready, logout, usesDefaultPassword } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const section = sectionForPath(pathname);

  useEffect(() => {
    if (ready && !currentUser) void navigate({ to: "/admin/login" });
  }, [ready, currentUser, navigate]);

  if (!ready || !currentUser) return null;

  const allowed = navItems.filter((item) => canAccess(currentUser.role, item.section));

  if (!canAccess(currentUser.role, section)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="font-display text-lg font-semibold">
            {tr({ vi: "Bạn không có quyền truy cập", en: "Access denied" })}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr({
              vi: "Khu vực này chỉ dành cho quản trị viên.",
              en: "This area is limited to administrators.",
            })}
          </p>
          <Button asChild className="mt-6">
            <Link to="/admin">{tr({ vi: "Về Tổng quan", en: "Back to overview" })}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-surface">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2.5 px-2">
          <BrandMark size={36} tone="sidebar" />
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-semibold">
              {tr(config.copy.brand)}
            </span>
            <span className="block truncate text-xs text-sidebar-foreground/60">HR Console</span>
          </span>
        </Link>

        <nav className="mt-8 space-y-1">
          {allowed.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground before:scale-y-100",
              }}
              inactiveProps={{ className: "text-sidebar-foreground/65 before:scale-y-0" }}
              className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-sidebar-primary before:transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(item.key)}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t border-sidebar-border pt-3">
          <div className="px-3 py-1">
            <p className="truncate text-sm font-medium">{currentUser.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {currentUser.role === "admin"
                ? tr({ vi: "Quản trị viên", en: "Administrator" })
                : tr({ vi: "Cộng tác viên (Mod)", en: "Moderator" })}
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{t("admin.backToSite")}</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              void navigate({ to: "/admin/login" });
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="truncate">{tr({ vi: "Đăng xuất", en: "Sign out" })}</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-semibold sm:text-2xl">{title}</h1>
              {description && (
                <p className="truncate text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {currentUser.name}
              </span>
              <LanguageToggle />
              {action}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={tr({ vi: "Đăng xuất", en: "Sign out" })}
                onClick={() => {
                  logout();
                  void navigate({ to: "/admin/login" });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
            {allowed.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {usesDefaultPassword && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <span>
                {tr({
                  vi: "Tài khoản của bạn vẫn dùng mật khẩu mặc định. Hãy đổi mật khẩu ngay để bảo vệ khu quản trị.",
                  en: "Your account still uses the default password. Change it now to protect the admin area.",
                })}
              </span>
              <Link
                to="/admin/users"
                className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
              >
                {tr({ vi: "Đổi mật khẩu", en: "Change password" })}
              </Link>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
