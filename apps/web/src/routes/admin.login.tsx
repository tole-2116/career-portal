import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BrandMark } from "@/components/site/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import { useSiteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Đăng nhập quản trị — TalentHub HR" },
      {
        name: "description",
        content: "Đăng nhập vào bảng điều khiển tuyển dụng TalentHub dành cho quản trị viên.",
      },
      { property: "og:title", content: "Đăng nhập quản trị — TalentHub HR" },
      { property: "og:description", content: "Khu vực quản trị nội bộ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { tr } = useI18n();
  const { config } = useSiteConfig();
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (currentUser) void navigate({ to: "/admin" });
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!lockedUntil) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [lockedUntil]);

  const waitSeconds = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (waitSeconds > 0) {
      toast.error(
        tr({
          vi: `Sai quá nhiều lần. Vui lòng thử lại sau ${waitSeconds} giây.`,
          en: `Too many attempts. Try again in ${waitSeconds}s.`,
        }),
      );
      return;
    }
    if (!username.trim() || !password) {
      toast.error(
        tr({ vi: "Vui lòng nhập đủ thông tin.", en: "Please fill in both fields." }),
      );
      return;
    }
    setBusy(true);
    const result = await login(username, password);
    setBusy(false);
    if (result.ok) {
      setFails(0);
      setLockedUntil(0);
      toast.success(tr({ vi: "Đăng nhập thành công.", en: "Signed in." }));
      void navigate({ to: "/admin" });
      return;
    }
    const next = fails + 1;
    setFails(next);
    if (next >= 5) {
      setFails(0);
      setLockedUntil(Date.now() + 60_000);
      setNow(Date.now());
      toast.error(
        tr({
          vi: "Sai quá 5 lần. Tạm khoá đăng nhập 60 giây.",
          en: "5 failed attempts. Sign-in paused for 60 seconds.",
        }),
      );
      return;
    }
    toast.error(
      result.error === "locked"
        ? tr({ vi: "Tài khoản đã bị khoá.", en: "This account is locked." })
        : tr({
            vi: "Tên đăng nhập hoặc mật khẩu không đúng.",
            en: "Incorrect username or password.",
          }),
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 shadow-soft">
        <div className="flex items-center gap-3">
          <BrandMark size={40} />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold">
              {tr(config.copy.brand)}
            </p>
            <p className="text-xs text-muted-foreground">HR Console</p>
          </div>
        </div>

        <h1 className="mt-6 font-display text-xl font-semibold">
          {tr({ vi: "Đăng nhập quản trị", en: "Admin sign in" })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tr({
            vi: "Dành cho quản trị viên và cộng tác viên nội dung.",
            en: "For administrators and content moderators.",
          })}
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="login-username">
              {tr({ vi: "Tên đăng nhập", en: "Username" })}
            </Label>
            <Input
              id="login-username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">{tr({ vi: "Mật khẩu", en: "Password" })}</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy || waitSeconds > 0}>
            {waitSeconds > 0
              ? tr({ vi: `Thử lại sau ${waitSeconds}s`, en: `Retry in ${waitSeconds}s` })
              : tr({ vi: "Đăng nhập", en: "Sign in" })}
          </Button>
        </form>

        <p className="mt-5 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          {tr({
            vi: "Khu vực nội bộ. Liên hệ quản trị viên nếu bạn chưa có tài khoản.",
            en: "Internal area. Contact your administrator if you do not have an account.",
          })}
        </p>
      </div>
    </main>
  );
}
