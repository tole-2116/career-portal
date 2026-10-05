import { db } from "@career-portal/database";

export type Localized = { vi: string; en: string };

export type FormFieldDto = {
  id: string;
  type: string;
  label: Localized;
  placeholder?: Localized;
  required: boolean;
  fullWidth: boolean;
  maxLength?: number;
  options?: Localized[];
};

export type FormSectionDto = {
  id: string;
  title: Localized;
  description?: Localized;
  includeJobFields: boolean;
  fields: FormFieldDto[];
};

export type FormConfigDto = {
  code?: string;
  name: string;
  sections: FormSectionDto[];
  submitLabel: Localized;
  successTitle: Localized;
  successBody: Localized;
};

type Row = {
  id: string;
  code: string | null;
  name: string;
  sections: unknown;
  submitLabel: unknown;
  successTitle: unknown;
  successBody: unknown;
};

function localized(value: unknown, allowEmpty = true): Localized {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    if (allowEmpty) return { vi: "", en: "" };
    throw new Error("value must be an object");
  }
  const raw = value as { vi?: unknown; en?: unknown };
  const vi = typeof raw.vi === "string" ? raw.vi.trim() : "";
  const en = typeof raw.en === "string" ? raw.en.trim() : "";
  if (!allowEmpty && !vi && !en) throw new Error("label must contain vi or en text");
  return { vi: vi || en, en: en || vi };
}

function localizedOrDefault(value: unknown, fallback: Localized): Localized {
  const result = localized(value);
  if (!result.vi && !result.en) return fallback;
  return result;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readField(value: unknown): FormFieldDto {
  const raw = asRecord(value);
  const type = typeof raw.type === "string" && raw.type ? raw.type : "text";
  const required = raw.required === true;
  const fullWidth = raw.fullWidth === true;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `field_${Math.random().toString(36).slice(2, 8)}`,
    type,
    label: localizedOrDefault(raw.label, { vi: "Câu hỏi mới", en: "New question" }),
    ...(raw.placeholder !== undefined ? { placeholder: localized(raw.placeholder) } : {}),
    required,
    fullWidth,
    ...(typeof raw.maxLength === "number" ? { maxLength: raw.maxLength } : {}),
    ...(Array.isArray(raw.options)
      ? {
          options: raw.options.map((option) => localized(option)),
        }
      : {}),
  };
}

function readSection(value: unknown): FormSectionDto {
  const raw = asRecord(value);
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `section_${Math.random().toString(36).slice(2, 8)}`,
    title: localizedOrDefault(raw.title, { vi: "Phần mới", en: "New section" }),
    ...(raw.description !== undefined ? { description: localized(raw.description) } : {}),
    includeJobFields: raw.includeJobFields === true,
    fields: asArray(raw.fields).map(readField),
  };
}

function readConfig(row: Row): FormConfigDto {
  return {
    ...(row.code ? { code: row.code } : {}),
    name: row.name,
    sections: asArray(row.sections).map(readSection),
    submitLabel: localizedOrDefault(row.submitLabel, { vi: "Gửi hồ sơ ứng tuyển", en: "Submit application" }),
    successTitle: localizedOrDefault(row.successTitle, { vi: "Đã nhận hồ sơ của bạn", en: "Application received" }),
    successBody: localizedOrDefault(row.successBody, {
      vi: "Cảm ơn bạn đã ứng tuyển. Đội ngũ nhân sự sẽ phản hồi trong vòng 5 ngày làm việc.",
      en: "Thanks for applying. Our people team will get back to you within five working days.",
    }),
  };
}

export class AdminFormConfigService {
  async get(): Promise<FormConfigDto> {
    const row = await db.form_configs.findFirst({ where: { isdelete: false } });
    if (!row) throw new Error("Form configuration not found");
    return readConfig(row);
  }

  async save(payload: Partial<FormConfigDto>, actor = "admin"): Promise<FormConfigDto> {
    const existing = await db.form_configs.findFirst({ where: { isdelete: false } });
    const sections = Array.isArray(payload.sections)
      ? payload.sections.map(readSection)
      : existing
        ? asArray(existing.sections).map(readSection)
        : [];
    const data = {
      name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : (existing?.name ?? "Biểu mẫu ứng tuyển"),
      sections,
      submitLabel: payload.submitLabel !== undefined
        ? localized(payload.submitLabel)
        : existing
          ? readConfig(existing).submitLabel
          : localized(undefined),
      successTitle: payload.successTitle !== undefined
        ? localized(payload.successTitle)
        : existing
          ? readConfig(existing).successTitle
          : localized(undefined),
      successBody: payload.successBody !== undefined
        ? localized(payload.successBody)
        : existing
          ? readConfig(existing).successBody
          : localized(undefined),
      code: existing?.code ?? payload.code ?? "application-form",
      userupdated_at: actor,
    };
    if (existing) {
      return readConfig(await db.form_configs.update({ where: { id: existing.id }, data }));
    }
    return readConfig(await db.form_configs.create({ data: { ...data, usercreate_at: actor } }));
  }

  async reset(actor = "admin"): Promise<FormConfigDto> {
    const { defaultFormConfig } = await import("../defaults/form-config.defaults.js");
    return this.save(
      {
        ...defaultFormConfig,
        sections: defaultFormConfig.sections.map((section: FormSectionDto) => ({
          ...section,
          fields: section.fields.map((field: FormFieldDto) => ({ ...field })),
        })),
      },
      actor,
    );
  }
}

export const adminFormConfigService = new AdminFormConfigService();
