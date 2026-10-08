import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resolveFormSections, useFormConfig, type FormField } from "@/lib/form-config";
import { useI18n } from "@/lib/i18n";
import { fetchPublicJob, submitJobApplication, type JobApplicationPayload } from "@/services/jobs.api";
import { ApiError } from "@/lib/api/request";
import { createDynamicRouteMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/jobs/$jobId/apply")({
  loader: async ({ params }) => {
    const job = await fetchPublicJob(params.jobId);
    return { job };
  },
  head: createDynamicRouteMeta<{ job: Awaited<ReturnType<typeof fetchPublicJob>> }>({
    title: (data) => (data?.job ? `Ứng tuyển ${data.job.title.vi}` : "Ứng tuyển"),
    description: (data) =>
      data?.job ? `Điền biểu mẫu ứng tuyển vị trí ${data.job.title.vi} và tải lên CV của bạn.` : "",
    noIndex: (data) => !data?.job,
  }),
  component: ApplyPage,
});

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = [".pdf", ".doc", ".docx"];

function ApplyPage() {
  const { job } = Route.useLoaderData();
  const { t, tr } = useI18n();
  const { formConfig } = useFormConfig();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string | null>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!job) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-3xl px-4 py-24 text-center sm:px-6">
          <p className="text-sm text-muted-foreground">{t("jobs.notfound")}</p>
          <Button asChild className="mt-6">
            <Link to="/jobs">{t("jobs.back")}</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  if (job.status !== "open") {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-3xl px-4 py-24 text-center sm:px-6">
          <p className="text-sm text-muted-foreground">
            {tr({
              vi: "Vị trí này không còn nhận hồ sơ.",
              en: "This position is no longer accepting applications.",
            })}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/jobs">{t("jobs.back")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/apply">
                {tr({ vi: "Gửi hồ sơ tự do", en: "Submit an open application" })}
              </Link>
            </Button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  function acceptFile(fieldId: string, next: File) {
    const lower = next.name.toLowerCase();
    if (!ACCEPTED.some((ext) => lower.endsWith(ext))) {
      setFiles((prev) => ({ ...prev, [fieldId]: null }));
      setFileErrors((prev) => ({ ...prev, [fieldId]: t("apply.cv.invalidType") }));
      return;
    }
    if (next.size > MAX_SIZE) {
      setFiles((prev) => ({ ...prev, [fieldId]: null }));
      setFileErrors((prev) => ({ ...prev, [fieldId]: t("apply.cv.tooLarge") }));
      return;
    }
    setFileErrors((prev) => ({ ...prev, [fieldId]: null }));
    setFiles((prev) => ({ ...prev, [fieldId]: next }));
  }

  function onDrop(fieldId: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(null);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) acceptFile(fieldId, dropped);
  }

  function renderField(field: FormField) {
    const value = values[field.id] ?? "";
    const setValue = (next: string) => setValues((prev) => ({ ...prev, [field.id]: next }));

    if (field.type === "file") {
      const file = files[field.id] ?? null;
      const error = fileErrors[field.id];
      return (
        <div key={field.id} className="space-y-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(field.id);
            }}
            onDragLeave={() => setDragging(null)}
            onDrop={(e) => onDrop(field.id, e)}
            className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragging === field.id ? "border-accent bg-accent/5" : "border-border bg-card"
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-accent" />
                <span className="truncate text-sm font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => ({ ...prev, [field.id]: null }))}
                  aria-label={t("apply.cv.remove")}
                  className="rounded-md p-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">
                  {tr(field.label)}
                  {field.required && <span className="ml-1 text-destructive">*</span>}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("apply.cv.hint")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => inputRefs.current[field.id]?.click()}
                >
                  {tr(field.label)}
                </Button>
              </>
            )}
            <input
              ref={(el) => {
                inputRefs.current[field.id] = el;
              }}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) acceptFile(field.id, selected);
              }}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );
    }

    if (field.type === "checkbox") {
      return (
        <div key={field.id} className="space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id={field.id}
              checked={checks[field.id] ?? false}
              onCheckedChange={(next) => {
                setChecks((prev) => ({ ...prev, [field.id]: next === true }));
                setFieldErrors((prev) => ({ ...prev, [field.id]: null }));
              }}
            />
            <Label htmlFor={field.id} className="text-sm leading-snug font-normal">
              {tr(field.label)}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
          </div>
          {fieldErrors[field.id] && (
            <p className="text-sm text-destructive">{fieldErrors[field.id]}</p>
          )}
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id}>
          {tr(field.label)}
          {field.required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        {field.type === "textarea" ? (
          <Textarea
            id={field.id}
            rows={4}
            required={field.required}
            maxLength={field.maxLength}
            value={value}
            placeholder={field.placeholder ? tr(field.placeholder) : undefined}
            onChange={(e) => setValue(e.target.value)}
          />
        ) : field.type === "select" ? (
          <Select value={value} onValueChange={setValue} required={field.required}>
            <SelectTrigger id={field.id}>
              <SelectValue placeholder={tr(field.label)} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.en} value={option.en}>
                  {tr(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={field.id}
            type={
              field.type === "url"
                ? "url"
                : field.type === "email"
                  ? "email"
                  : field.type === "tel"
                    ? "tel"
                    : "text"
            }
            required={field.required}
            maxLength={field.maxLength}
            value={value}
            placeholder={field.placeholder ? tr(field.placeholder) : undefined}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
      </div>
    );
  }

  if (submitted) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-xl px-4 py-24 text-center sm:px-6">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-6 font-display text-2xl font-semibold">
            {tr(formConfig.successTitle)}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{tr(formConfig.successBody)}</p>
          <Button asChild className="mt-8">
            <Link to="/jobs">{t("apply.success.more")}</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  // Captured so the closures below keep the non-null narrowing of `job`.
  const activeJob = job;

  const sections = resolveFormSections(formConfig, activeJob);

  /** Maps form field ids/types onto the backend application contract. */
  function buildPayload(): JobApplicationPayload {
    const allFields = sections.flatMap((section) => section.resolved);
    const findId = (predicate: (field: FormField) => boolean): string | undefined =>
      allFields.find(predicate)?.id;

    const nameId =
      findId((field) => field.id === "fullName") ??
      findId((field) => field.type === "text" && field.id.toLowerCase().includes("name")) ??
      findId((field) => field.type === "text");
    const emailId = findId((field) => field.type === "email");
    const phoneId = findId((field) => field.type === "tel");
    const addressId =
      findId((field) => field.id === "address") ??
      findId((field) => field.id === "city") ??
      findId((field) => field.id.toLowerCase().includes("address"));
    const coverLetterId =
      findId((field) => field.id === "coverLetter") ??
      findId((field) => field.type === "textarea");

    const formData: Record<string, string | boolean> = {};
    for (const field of allFields) {
      if (field.type === "file") {
        const file = files[field.id];
        formData[field.id] = file ? file.name : "";
      } else if (field.type === "checkbox") {
        formData[field.id] = checks[field.id] ?? false;
      } else {
        formData[field.id] = values[field.id] ?? "";
      }
    }

    const read = (id: string | undefined): string => (id ? (values[id] ?? "").trim() : "");

    const cvField = allFields.find((field) => field.type === "file" && files[field.id]);
    const cv = cvField ? files[cvField.id] : null;
    if (!cv) throw new Error(t("apply.cv.required"));

    return {
      name: read(nameId),
      email: read(emailId),
      phone: read(phoneId),
      ...(read(addressId) ? { address: read(addressId) } : {}),
      ...(read(coverLetterId) ? { coverLetter: read(coverLetterId) } : {}),
      formData,
      cv,
    };
  }

  async function submit() {
    if (isSubmitting) return;
    setSubmitError(null);

    const allFields = sections.flatMap((section) => section.resolved);
    const errors: Record<string, string | null> = {};

    for (const field of allFields) {
      if (!field.required) continue;
      if (field.type === "checkbox") {
        if (!checks[field.id]) errors[field.id] = t("apply.required");
      } else if (field.type === "file") {
        if (!files[field.id]) errors[field.id] = t("apply.cv.required");
      } else if (!(values[field.id] ?? "").trim()) {
        errors[field.id] = t("apply.required");
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFileErrors(errors);
      return;
    }

    setFieldErrors({});
    setFileErrors({});
    setIsSubmitting(true);
    try {
      await submitJobApplication(activeJob.id, buildPayload());
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : t("apply.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to="/jobs/$jobId"
          params={{ jobId: activeJob.id }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {tr(activeJob.title)}
        </Link>

        <h1 className="mt-6 font-display text-3xl font-bold">
          {t("apply.title")}: {tr(activeJob.title)}
        </h1>

        <form
          className="mt-10 space-y-10"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {sections.map((section, index) => (
            <section key={section.id} className="surface-panel space-y-5 p-6 sm:p-8">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  <span className="mr-2 text-accent">{String(index + 1).padStart(2, "0")}</span>
                  {tr(section.title)}
                </h2>
                {section.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{tr(section.description)}</p>
                )}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {section.resolved.map((field) => (
                  <div key={field.id} className={field.fullWidth ? "sm:col-span-2" : undefined}>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {submitError && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? t("apply.submitting") : tr(formConfig.submitLabel)}
          </Button>
        </form>
      </div>
    </SiteLayout>
  );
}
