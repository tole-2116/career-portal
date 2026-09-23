import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { useInbox } from "@/lib/inbox-store";
import { useSiteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Liên hệ — TalentHub | Contact us" },
      {
        name: "description",
        content:
          "Gửi câu hỏi tới đội ngũ tuyển dụng TalentHub, xem địa chỉ văn phòng, email và số điện thoại liên hệ.",
      },
      { property: "og:title", content: "Liên hệ — TalentHub" },
      {
        property: "og:description",
        content: "Địa chỉ văn phòng, email, điện thoại và biểu mẫu gửi liên hệ tới TalentHub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập họ tên").max(100),
  email: z.string().trim().email("Email không hợp lệ").max(255),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().min(1, "Vui lòng nhập chủ đề").max(150),
  body: z.string().trim().min(10, "Nội dung tối thiểu 10 ký tự").max(2000),
});

function ContactPage() {
  const { tr } = useI18n();
  const { config } = useSiteConfig();
  const company = config.company;
  const { addMessage } = useInbox();

  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", body: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            {tr({ vi: "Liên hệ", en: "Contact us" })}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {tr({
              vi: "Bạn có câu hỏi về cơ hội nghề nghiệp hoặc muốn hợp tác? Gửi tin nhắn cho chúng tôi.",
              en: "Questions about careers or partnerships? Send us a message.",
            })}
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="min-w-0 space-y-6 rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">
            {tr({ vi: "Thông tin liên hệ", en: "Contact information" })}
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            {company.locations.map((loc) => (
              <p key={loc.id} className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">{tr(loc.name)}</span>
                  {tr(loc.address)}
                </span>
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

          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="flex items-center gap-2 font-display text-sm font-semibold">
              <Clock className="h-4 w-4 text-accent" />
              {tr({ vi: "Giờ làm việc", en: "Working hours" })}
            </p>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>{tr({ vi: "Thứ Hai – Thứ Sáu: 8:30 – 17:30", en: "Monday – Friday: 8:30 – 17:30" })}</p>
              <p>{tr({ vi: "Thứ Bảy, Chủ Nhật: nghỉ", en: "Saturday, Sunday: closed" })}</p>
              <p>
                {tr({
                  vi: "Chúng tôi phản hồi email trong vòng 2 ngày làm việc.",
                  en: "We reply to emails within 2 working days.",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-border bg-card p-6">
          {sent ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <h2 className="mt-4 font-display text-xl font-semibold">
                {tr({ vi: "Đã gửi tin nhắn", en: "Message sent" })}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {tr({
                  vi: "Cảm ơn bạn, chúng tôi sẽ phản hồi sớm nhất có thể.",
                  en: "Thank you, we will get back to you soon.",
                })}
              </p>
              <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                {tr({ vi: "Gửi tin nhắn khác", en: "Send another message" })}
              </Button>
            </div>
          ) : (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                const result = schema.safeParse(form);
                if (!result.success) {
                  const next: Record<string, string> = {};
                  for (const issue of result.error.issues) {
                    const key = String(issue.path[0]);
                    if (!next[key]) next[key] = issue.message;
                  }
                  setErrors(next);
                  return;
                }
                setErrors({});
                addMessage({
                  name: result.data.name,
                  email: result.data.email,
                  phone: result.data.phone ?? "",
                  subject: result.data.subject,
                  body: result.data.body,
                });
                setForm({ name: "", email: "", phone: "", subject: "", body: "" });
                setSent(true);
                toast.success(tr({ vi: "Đã gửi tin nhắn liên hệ.", en: "Message sent." }));
              }}
            >
              <h2 className="font-display text-lg font-semibold">
                {tr({ vi: "Gửi liên hệ", en: "Send a message" })}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">{tr({ vi: "Họ và tên", en: "Full name" })} *</Label>
                  <Input
                    id="contact-name"
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => set("name")(e.target.value)}
                  />
                  {errors["name"] && <p className="text-sm text-destructive">{errors["name"]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email *</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => set("email")(e.target.value)}
                  />
                  {errors["email"] && <p className="text-sm text-destructive">{errors["email"]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">
                    {tr({ vi: "Số điện thoại", en: "Phone number" })}
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    maxLength={30}
                    value={form.phone}
                    onChange={(e) => set("phone")(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-subject">{tr({ vi: "Chủ đề", en: "Subject" })} *</Label>
                  <Input
                    id="contact-subject"
                    maxLength={150}
                    value={form.subject}
                    onChange={(e) => set("subject")(e.target.value)}
                  />
                  {errors["subject"] && (
                    <p className="text-sm text-destructive">{errors["subject"]}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-body">{tr({ vi: "Nội dung", en: "Message" })} *</Label>
                <Textarea
                  id="contact-body"
                  rows={6}
                  maxLength={2000}
                  value={form.body}
                  onChange={(e) => set("body")(e.target.value)}
                />
                {errors["body"] && <p className="text-sm text-destructive">{errors["body"]}</p>}
              </div>
              <Button type="submit" size="lg">
                {tr({ vi: "Gửi liên hệ", en: "Send message" })}
              </Button>
            </form>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
