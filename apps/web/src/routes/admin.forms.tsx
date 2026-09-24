import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  GripVertical,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { jobs } from "@/data/jobs";
import {
  createField,
  createSection,
  defaultFormConfig,
  fieldTypeLabels,
  fieldTypes,
  useFormConfig,
  type FieldType,
  type FormConfig,
  type FormField,
  type FormSection,
} from "@/lib/form-config";
import { LocalizedField } from "@/components/admin/LocalizedInput";
import { useI18n, type Localized } from "@/lib/i18n";

export const Route = createFileRoute("/admin/forms")({
  head: () => ({
    meta: [
      { title: "Cấu hình biểu mẫu ứng tuyển — TalentHub" },
      {
        name: "description",
        content: "Tự thiết kế các phần và trường thông tin của biểu mẫu ứng tuyển.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Cấu hình biểu mẫu ứng tuyển — TalentHub" },
      {
        property: "og:description",
        content: "Tự thiết kế các phần và trường thông tin của biểu mẫu ứng tuyển.",
      },
    ],
  }),
  component: FormBuilderPage,
});

const copy = {
  title: { vi: "Biểu mẫu ứng tuyển", en: "Application form" },
  subtitle: {
    vi: "Tự thêm, sửa, sắp xếp các phần và câu hỏi của biểu mẫu ứng tuyển.",
    en: "Add, edit and reorder the sections and questions of the application form.",
  },
  save: { vi: "Lưu biểu mẫu", en: "Save form" },
  reset: { vi: "Khôi phục mặc định", en: "Restore default" },
  preview: { vi: "Xem biểu mẫu", en: "Preview form" },
  addSection: { vi: "Thêm phần", en: "Add section" },
  addField: { vi: "Thêm câu hỏi", en: "Add question" },
  sectionTitle: { vi: "Tên phần", en: "Section title" },
  sectionDesc: { vi: "Mô tả ngắn (không bắt buộc)", en: "Short description (optional)" },
  includeJobFields: {
    vi: "Tự động thêm câu hỏi riêng của từng vị trí",
    en: "Automatically append role-specific questions",
  },
  label: { vi: "Nhãn câu hỏi", en: "Question label" },
  placeholder: { vi: "Gợi ý nhập", en: "Placeholder" },
  type: { vi: "Kiểu câu hỏi", en: "Question type" },
  required: { vi: "Bắt buộc", en: "Required" },
  fullWidth: { vi: "Chiếm cả hàng", en: "Full width" },
  options: {
    vi: "Lựa chọn (mỗi dòng: Tiếng Việt | English)",
    en: "Options (one per line: Vietnamese | English)",
  },
  submitLabel: { vi: "Chữ trên nút gửi", en: "Submit button label" },
  successTitle: { vi: "Tiêu đề khi gửi thành công", en: "Success title" },
  successBody: { vi: "Nội dung khi gửi thành công", en: "Success message" },
  vi: { vi: "Tiếng Việt", en: "Vietnamese" },
  en: { vi: "Tiếng Anh", en: "English" },
  noFields: { vi: "Chưa có câu hỏi nào trong phần này.", en: "No questions in this section yet." },
  saved: { vi: "Đã lưu biểu mẫu ứng tuyển.", en: "Application form saved." },
  wasReset: { vi: "Đã khôi phục biểu mẫu mặc định.", en: "Default form restored." },
  autoFields: { vi: "Câu hỏi theo vị trí", en: "Role questions" },
  general: { vi: "Thông tin chung", en: "General" },
} satisfies Record<string, Localized>;

function LocalizedInput({
  value,
  onChange,
  label,
  multiline,
}: {
  value: Localized;
  onChange: (next: Localized) => void;
  label: string;
  multiline?: boolean;
}) {
  return (
    <LocalizedField
      label={label}
      value={value}
      onChange={onChange}
      {...(multiline ? { multiline: true } : {})}
    />
  );
}

function FieldEditor({
  field,
  onChange,
  onRemove,
  onMove,
}: {
  field: FormField;
  onChange: (next: FormField) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const { tr } = useI18n();

  const optionsText = (field.options ?? []).map((o) => `${o.vi} | ${o.en}`).join("\n");

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-2">
        <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1 space-y-4">
          <LocalizedInput
            label={tr(copy.label)}
            value={field.label}
            onChange={(label) => onChange({ ...field, label })}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{tr(copy.type)}</Label>
              <Select
                value={field.type}
                onValueChange={(next) => onChange({ ...field, type: next as FieldType })}
              >
                <SelectTrigger>
                  <SelectValue>{tr(fieldTypeLabels[field.type])}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {tr(fieldTypeLabels[type])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-6 pb-1">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={field.required}
                  onCheckedChange={(required) => onChange({ ...field, required })}
                />
                {tr(copy.required)}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={field.fullWidth}
                  onCheckedChange={(fullWidth) => onChange({ ...field, fullWidth })}
                />
                {tr(copy.fullWidth)}
              </label>
            </div>
          </div>

          {field.type !== "checkbox" && field.type !== "file" && field.type !== "select" && (
            <LocalizedInput
              label={tr(copy.placeholder)}
              value={field.placeholder ?? { vi: "", en: "" }}
              onChange={(placeholder) => onChange({ ...field, placeholder })}
            />
          )}

          {field.type === "select" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{tr(copy.options)}</Label>
              <Textarea
                rows={3}
                value={optionsText}
                onChange={(e) =>
                  onChange({
                    ...field,
                    options: e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => {
                        const [vi, en] = line.split("|").map((part) => part.trim());
                        return { vi: vi ?? "", en: en ?? vi ?? "" };
                      }),
                  })
                }
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={() => onMove(-1)}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => onMove(1)}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item!);
  return next;
}

function FormBuilderPage() {
  const { tr } = useI18n();
  const { formConfig, saveFormConfig, resetFormConfig } = useFormConfig();
  const [draft, setDraft] = useState<FormConfig>(formConfig);

  const previewJob = jobs.find((job) => job.status === "open") ?? jobs[0]!;

  const updateSection = (index: number, next: FormSection) =>
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) => (i === index ? next : section)),
    }));

  return (
    <AdminLayout
      title={tr(copy.title)}
      description={tr(copy.subtitle)}
      action={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/jobs/$jobId/apply" params={{ jobId: previewJob.id }}>
              <Eye className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">{tr(copy.preview)}</span>
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              saveFormConfig(draft);
              toast.success(tr(copy.saved));
            }}
          >
            <Save className="mr-1.5 h-4 w-4" />
            {tr(copy.save)}
          </Button>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {draft.sections.map((section, sectionIndex) => (
          <Card key={section.id}>
            <CardHeader className="gap-4">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="font-display text-base">
                  {String(sectionIndex + 1).padStart(2, "0")} · {tr(section.title)}
                </CardTitle>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        sections: move(prev.sections, sectionIndex, -1),
                      }))
                    }
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        sections: move(prev.sections, sectionIndex, 1),
                      }))
                    }
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        sections: prev.sections.filter((_, i) => i !== sectionIndex),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <LocalizedInput
                label={tr(copy.sectionTitle)}
                value={section.title}
                onChange={(title) => updateSection(sectionIndex, { ...section, title })}
              />
              <LocalizedInput
                label={tr(copy.sectionDesc)}
                value={section.description ?? { vi: "", en: "" }}
                onChange={(description) => updateSection(sectionIndex, { ...section, description })}
              />
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={section.includeJobFields}
                  onCheckedChange={(includeJobFields) =>
                    updateSection(sectionIndex, { ...section, includeJobFields })
                  }
                />
                {tr(copy.includeJobFields)}
                {section.includeJobFields && (
                  <Badge variant="secondary" className="ml-1">
                    {tr(copy.autoFields)}
                  </Badge>
                )}
              </label>
            </CardHeader>

            <CardContent className="space-y-3">
              {section.fields.length === 0 && (
                <p className="text-sm text-muted-foreground">{tr(copy.noFields)}</p>
              )}
              {section.fields.map((field, fieldIndex) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  onChange={(next) =>
                    updateSection(sectionIndex, {
                      ...section,
                      fields: section.fields.map((f, i) => (i === fieldIndex ? next : f)),
                    })
                  }
                  onRemove={() =>
                    updateSection(sectionIndex, {
                      ...section,
                      fields: section.fields.filter((_, i) => i !== fieldIndex),
                    })
                  }
                  onMove={(direction) =>
                    updateSection(sectionIndex, {
                      ...section,
                      fields: move(section.fields, fieldIndex, direction),
                    })
                  }
                />
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateSection(sectionIndex, {
                    ...section,
                    fields: [...section.fields, createField()],
                  })
                }
              >
                <Plus className="mr-1.5 h-4 w-4" />
                {tr(copy.addField)}
              </Button>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setDraft((prev) => ({ ...prev, sections: [...prev.sections, createSection()] }))
          }
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {tr(copy.addSection)}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">{tr(copy.general)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LocalizedInput
              label={tr(copy.submitLabel)}
              value={draft.submitLabel}
              onChange={(submitLabel) => setDraft((prev) => ({ ...prev, submitLabel }))}
            />
            <LocalizedInput
              label={tr(copy.successTitle)}
              value={draft.successTitle}
              onChange={(successTitle) => setDraft((prev) => ({ ...prev, successTitle }))}
            />
            <LocalizedInput
              multiline
              label={tr(copy.successBody)}
              value={draft.successBody}
              onChange={(successBody) => setDraft((prev) => ({ ...prev, successBody }))}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2 pb-6">
          <Button
            onClick={() => {
              saveFormConfig(draft);
              toast.success(tr(copy.saved));
            }}
          >
            <Save className="mr-1.5 h-4 w-4" />
            {tr(copy.save)}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              resetFormConfig();
              setDraft(structuredClone(defaultFormConfig));
              toast.success(tr(copy.wasReset));
            }}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            {tr(copy.reset)}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
