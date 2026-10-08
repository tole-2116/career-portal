import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  GripVertical,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-route-guard";
import { FormPreview } from "@/components/admin/FormPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  fetchAdminFormConfig,
  saveAdminFormConfig,
} from "@/services/admin-form-config.api";
import { createRouteMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/forms")({
  beforeLoad: ({ location }) => requireAdminSession(location.pathname),
  head: createRouteMeta({
    titleKey: "admin.forms.meta.title",
    descriptionKey: "admin.forms.meta.description",
    ogDescriptionKey: "admin.forms.meta.ogDescription",
    noIndex: true,
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
  preview: { vi: "Xem biểu mẫu", en: "Preview form" },
  previewTitle: { vi: "Xem trước biểu mẫu ứng tuyển", en: "Application form preview" },
  previewDesc: {
    vi: "Cấu hình đang được lưu trên hệ thống, sau khi ứng viên xem vị trí.",
    en: "The configuration currently saved on the system, as candidates see it.",
  },
  previewLoading: { vi: "Đang tải bản xem trước...", en: "Loading preview..." },
  previewFailed: { vi: "Không tải được bản xem trước.", en: "Failed to load the preview." },
  previewRetry: { vi: "Thử lại", en: "Retry" },
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
  const { formConfig } = useFormConfig();
  const [draft, setDraft] = useState<FormConfig>(formConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewConfig, setPreviewConfig] = useState<FormConfig | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const config = await fetchAdminFormConfig();
      setDraft(config);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tr({
              vi: "Không tải được cấu hình biểu mẫu.",
              en: "Failed to load form configuration.",
            }),
      );
    } finally {
      setIsLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const save = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await saveAdminFormConfig(draft);
      toast.success(tr(copy.saved));
      await loadConfig();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tr({ vi: "Không lưu được biểu mẫu.", en: "Failed to save form." }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openPreview = async () => {
    setIsPreviewOpen(true);
    setIsPreviewLoading(true);
    setPreviewConfig(null);
    setPreviewError(null);
    try {
      setPreviewConfig(await fetchAdminFormConfig());
    } catch (error) {
      setPreviewError(
        error instanceof Error ? error.message : tr(copy.previewFailed),
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

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
          <Button variant="outline" size="sm" onClick={() => void openPreview()}>
            <Eye className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">{tr(copy.preview)}</span>
          </Button>
          <Button size="sm" onClick={() => void save()} disabled={isSaving || isLoading}>
            {isSaving || isLoading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {tr(copy.save)}
          </Button>
        </div>
      }
    >
      <div className="relative mx-auto min-h-0 w-full max-w-4xl flex-1 space-y-6 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.2)_transparent]">
        {isLoading && (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {tr({ vi: "Đang tải cấu hình...", en: "Loading configuration..." })}
          </div>
        )}
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
          <Button onClick={() => void save()} disabled={isSaving || isLoading}>
            {isSaving || isLoading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {tr(copy.save)}
          </Button>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-12">
            <DialogTitle>{tr(copy.previewTitle)}</DialogTitle>
            <DialogDescription>{tr(copy.previewDesc)}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.2)_transparent]">
            {isPreviewLoading && (
              <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {tr(copy.previewLoading)}
              </div>
            )}
            {!isPreviewLoading && previewError && (
              <div className="flex min-h-48 flex-col items-center justify-center gap-4 text-center">
                <p className="text-sm text-destructive">{previewError}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => void openPreview()}>
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  {tr(copy.previewRetry)}
                </Button>
              </div>
            )}
            {!isPreviewLoading && !previewError && previewConfig && (
              <FormPreview config={previewConfig} job={previewJob} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
