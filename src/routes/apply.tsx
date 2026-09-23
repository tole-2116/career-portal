import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, FileText, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { useInbox } from "@/lib/inbox-store";
import { useSiteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Gửi hồ sơ tự do — TalentHub | Open application" },
      {
        name: "description",
        content:
          "Chưa thấy vị trí phù hợp? Gửi hồ sơ tự do để đội ngũ tuyển dụng TalentHub liên hệ khi có cơ hội mới.",
      },
      { property: "og:title", content: "Gửi hồ sơ tự do — TalentHub" },
      {
        property: "og:description",
        content: "Gửi CV không gắn vị trí cụ thể, chúng tôi sẽ liên hệ khi có cơ hội phù hợp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpenApplyPage,
});

const ACCEPTED = [".pdf", ".doc", ".docx"];
const MAX_SIZE = 5 * 1024 * 1024;

function OpenApplyPage() {
  const { t, tr } = useI18n();
  const { addOpenApplication } = useInbox();
  const { config } = useSiteConfig();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!config.modules.openApplication) void navigate({ to: "/jobs" });
  }, [config.modules.openApplication, navigate]);

  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function acceptFile(next: File) {
    const lower = next.name.toLowerCase();
    if (!ACCEPTED.some((ext) => lower.endsWith(ext))) {
      setFile(null);
      setFileError(t("apply.cv.invalidType"));
      return;
    }
    if (next.size > MAX_SIZE) {
      setFile(null);
      setFileError(t("apply.cv.tooLarge"));
      return;
    }
    setFileError(null);
    setFile(next);
  }

  if (submitted) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-xl px-4 py-24 text-center sm:px-6">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-6 font-display text-2xl font-semibold">
            {tr({ vi: "Đã nhận hồ sơ của bạn", en: "We received your application" })}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {tr({
              vi: "Hồ sơ được lưu vào mục Hồ sơ tự do và sẽ được đội ngũ tuyển dụng xem xét.",
              en: "Your CV is saved as an open application and will be reviewed by our team.",
            })}
          </p>
          <Button asChild className="mt-8">
            <Link to="/jobs">{t("apply.success.more")}</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-bold">
          {tr({ vi: "Gửi hồ sơ tự do", en: "Submit an open application" })}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {tr({
            vi: "Không cần chọn vị trí cụ thể. Chúng tôi sẽ liên hệ khi có cơ hội phù hợp với bạn.",
            en: "No need to pick a specific role. We will reach out when a matching opportunity opens.",
          })}
        </p>

        <form
          className="surface-panel mt-10 space-y-5 p-6 sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (!file) {
              setFileError(t("apply.cv.required"));
              return;
            }
            addOpenApplication({
              name: form.name,
              email: form.email,
              phone: form.phone,
              note: form.note,
              fileName: file.name,
            });
            setSubmitted(true);
            toast.success(tr({ vi: "Đã gửi hồ sơ tự do.", en: "Open application sent." }));
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="open-name">{tr({ vi: "Họ và tên", en: "Full name" })} *</Label>
              <Input
                id="open-name"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="open-email">Email *</Label>
              <Input
                id="open-email"
                type="email"
                required
                maxLength={255}
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="open-phone">{tr({ vi: "Số điện thoại", en: "Phone number" })}</Label>
              <Input
                id="open-phone"
                type="tel"
                maxLength={30}
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="open-note">
                {tr({ vi: "Lĩnh vực quan tâm / ghi chú", en: "Area of interest / note" })}
              </Label>
              <Textarea
                id="open-note"
                rows={4}
                maxLength={1000}
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-lg border-2 border-dashed border-border bg-card p-8 text-center">
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-accent" />
                  <span className="truncate text-sm font-medium">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label={t("apply.cv.remove")}
                    className="rounded-md p-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">{tr({ vi: "Tải CV", en: "Upload CV" })}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("apply.cv.hint")}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => inputRef.current?.click()}
                  >
                    {tr({ vi: "Chọn tệp", en: "Choose file" })}
                  </Button>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) acceptFile(selected);
                }}
              />
            </div>
            {fileError && <p className="text-sm text-destructive">{fileError}</p>}
          </div>

          <Button type="submit" size="lg">
            {tr({ vi: "Gửi hồ sơ", en: "Send application" })}
          </Button>
        </form>
      </div>
    </SiteLayout>
  );
}
