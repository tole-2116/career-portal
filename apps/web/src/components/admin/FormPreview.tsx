import { FileText, UploadCloud } from "lucide-react";

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
import type { Job } from "@/data/jobs";
import { resolveFormSections, type FormConfig, type FormField } from "@/lib/form-config";
import { useI18n } from "@/lib/i18n";

export function FormPreview({ config, job }: { config: FormConfig; job: Job }) {
  const { tr } = useI18n();
  const sections = resolveFormSections(config, job);

  const renderField = (field: FormField) => {
    const label = (
      <>
        {tr(field.label)}
        {field.required && <span className="ml-1 text-destructive">*</span>}
      </>
    );

    if (field.type === "file") {
      return (
        <div className="rounded-lg border-2 border-dashed border-border bg-card p-6 text-center">
          <UploadCloud className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tr({ vi: "PDF, DOC hoặc DOCX tối đa 5MB", en: "PDF, DOC or DOCX up to 5MB" })}
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" disabled>
            <FileText className="mr-1.5 h-4 w-4" />
            {tr({ vi: "Chọn tệp", en: "Choose file" })}
          </Button>
        </div>
      );
    }

    if (field.type === "checkbox") {
      return (
        <div className="flex items-start gap-3">
          <Checkbox id={`preview-${field.id}`} disabled />
          <Label htmlFor={`preview-${field.id}`} className="text-sm font-normal leading-snug">
            {label}
          </Label>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={`preview-${field.id}`}>{label}</Label>
        {field.type === "textarea" ? (
          <Textarea
            id={`preview-${field.id}`}
            rows={4}
            disabled
            placeholder={field.placeholder ? tr(field.placeholder) : undefined}
          />
        ) : field.type === "select" ? (
          <Select disabled>
            <SelectTrigger id={`preview-${field.id}`}>
              <SelectValue placeholder={tr(field.label)} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={`${field.id}-${option.en}`} value={option.en}>
                  {tr(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={`preview-${field.id}`}
            type={
              field.type === "url"
                ? "url"
                : field.type === "email"
                  ? "email"
                  : field.type === "tel"
                    ? "tel"
                    : "text"
            }
            disabled
            placeholder={field.placeholder ? tr(field.placeholder) : undefined}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 text-sm text-muted-foreground">
        {tr({
          vi: `Bản xem trước cho vị trí: ${tr(job.title)}`,
          en: `Preview for: ${tr(job.title)}`,
        })}
      </div>
      {sections.map((section, index) => (
        <section key={section.id} className="surface-panel space-y-5 p-5 sm:p-6">
          <div>
            <h3 className="font-display text-lg font-semibold">
              <span className="mr-2 text-accent">{String(index + 1).padStart(2, "0")}</span>
              {tr(section.title)}
            </h3>
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
      <Button type="button" size="lg" className="w-full sm:w-auto" disabled>
        {tr(config.submitLabel)}
      </Button>
    </div>
  );
}
