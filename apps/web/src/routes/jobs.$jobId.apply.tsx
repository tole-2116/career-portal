import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, FileText, Info, UploadCloud, X } from "lucide-react";
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
import { getJob, type DynamicField } from "@/data/jobs";
import { useFormConfig, type FormField } from "@/lib/form-config";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/jobs/$jobId/apply")({
  loader: ({ params }) => ({ job: getJob(params.jobId) ?? null }),
  head: ({ loaderData }) => {
    const job = loaderData?.job;
    if (!job) {
      return {
        meta: [{ title: "Ứng tuyển — TalentHub" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `Ứng tuyển ${job.title.vi} — TalentHub | Apply`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Điền biểu mẫu ứng tuyển vị trí ${job.title.vi} và tải lên CV của bạn.`,
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: `Điền biểu mẫu ứng tuyển vị trí ${job.title.vi} và tải lên CV của bạn.`,
        },
      ],
    };
  },
  component: ApplyPage,
});

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = [".pdf", ".doc", ".docx"];

/** Turns a job's role-specific question into the shared form field shape. */
function fromDynamicField(field: DynamicField): FormField {
  return {
    id: field.id,
    type: field.type,
    label: field.label,
    ...(field.placeholder ? { placeholder: field.placeholder } : {}),
    required: field.required,
    fullWidth: field.type === "textarea",
    ...(field.options ? { options: field.options } : {}),
  };
}

function ApplyPage() {
  const { job } = Route.useLoaderData();
  const { t, tr } = useI18n();
  const { formConfig } = useFormConfig();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string | null>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});

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
        <div key={field.id} className="flex items-start gap-3">
          <Checkbox
            id={field.id}
            checked={checks[field.id] ?? false}
            onCheckedChange={(next) =>
              setChecks((prev) => ({ ...prev, [field.id]: next === true }))
            }
          />
          <Label htmlFor={field.id} className="text-sm leading-snug font-normal">
            {tr(field.label)}
            {field.required && <span className="ml-1 text-destructive">*</span>}
          </Label>
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

  const sections = formConfig.sections
    .map((section) => ({
      ...section,
      resolved: section.includeJobFields
        ? [...section.fields, ...job.extraFields.map(fromDynamicField)]
        : section.fields,
    }))
    .filter((section) => section.resolved.length > 0);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to="/jobs/$jobId"
          params={{ jobId: job.id }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {tr(job.title)}
        </Link>

        <h1 className="mt-6 font-display text-3xl font-bold">
          {t("apply.title")}: {tr(job.title)}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" /> {t("apply.demoNote")}
        </p>

        <form
          className="mt-10 space-y-10"
          onSubmit={(event) => {
            event.preventDefault();
            const requiredFiles = sections
              .flatMap((section) => section.resolved)
              .filter((field) => field.type === "file" && field.required);
            const missing = requiredFiles.find((field) => !files[field.id]);
            if (missing) {
              setFileErrors((prev) => ({ ...prev, [missing.id]: t("apply.cv.required") }));
              return;
            }
            setSubmitted(true);
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

          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {tr(formConfig.submitLabel)}
          </Button>
        </form>
      </div>
    </SiteLayout>
  );
}
