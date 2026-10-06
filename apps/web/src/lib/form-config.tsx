import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { DynamicField, Job } from "@/data/jobs";
import type { Localized } from "@/lib/i18n";

export const fieldTypes = [
  "text",
  "email",
  "tel",
  "url",
  "textarea",
  "select",
  "checkbox",
  "file",
] as const;
export type FieldType = (typeof fieldTypes)[number];

export const fieldTypeLabels: Record<FieldType, Localized> = {
  text: { vi: "Văn bản ngắn", en: "Short text" },
  email: { vi: "Email", en: "Email" },
  tel: { vi: "Số điện thoại", en: "Phone" },
  url: { vi: "Đường dẫn", en: "Link / URL" },
  textarea: { vi: "Văn bản dài", en: "Long text" },
  select: { vi: "Danh sách chọn", en: "Dropdown" },
  checkbox: { vi: "Ô đánh dấu", en: "Checkbox" },
  file: { vi: "Tải tệp lên", en: "File upload" },
};

export type FormField = {
  id: string;
  type: FieldType;
  label: Localized;
  placeholder?: Localized;
  required: boolean;
  fullWidth: boolean;
  maxLength?: number;
  options?: Localized[];
};

export type FormSection = {
  id: string;
  title: Localized;
  description?: Localized;
  /** When true, the role-specific questions defined on each job are appended here. */
  includeJobFields: boolean;
  fields: FormField[];
};

export type FormConfig = {
  sections: FormSection[];
  submitLabel: Localized;
  successTitle: Localized;
  successBody: Localized;
};

export const defaultFormConfig: FormConfig = {
  sections: [
    {
      id: "profile",
      title: { vi: "Thông tin cá nhân", en: "Your details" },
      includeJobFields: false,
      fields: [
        {
          id: "fullName",
          type: "text",
          label: { vi: "Họ và tên", en: "Full name" },
          required: true,
          fullWidth: false,
          maxLength: 100,
        },
        {
          id: "email",
          type: "email",
          label: { vi: "Email", en: "Email" },
          required: true,
          fullWidth: false,
          maxLength: 255,
        },
        {
          id: "phone",
          type: "tel",
          label: { vi: "Số điện thoại", en: "Phone number" },
          required: true,
          fullWidth: false,
          maxLength: 20,
        },
        {
          id: "city",
          type: "text",
          label: { vi: "Nơi ở hiện tại", en: "Current location" },
          required: false,
          fullWidth: false,
          maxLength: 100,
        },
        {
          id: "linkedin",
          type: "url",
          label: { vi: "LinkedIn (không bắt buộc)", en: "LinkedIn (optional)" },
          required: false,
          fullWidth: true,
          maxLength: 255,
        },
      ],
    },
    {
      id: "cv",
      title: { vi: "Hồ sơ & CV", en: "Resume & CV" },
      includeJobFields: false,
      fields: [
        {
          id: "cv",
          type: "file",
          label: { vi: "Tải lên CV", en: "Upload your CV" },
          required: true,
          fullWidth: true,
        },
        {
          id: "coverLetter",
          type: "textarea",
          label: { vi: "Thư giới thiệu", en: "Cover letter" },
          placeholder: {
            vi: "Vì sao bạn phù hợp với vị trí này?",
            en: "Why are you a good fit for this role?",
          },
          required: false,
          fullWidth: true,
          maxLength: 1000,
        },
      ],
    },
    {
      id: "extra",
      title: { vi: "Câu hỏi riêng cho vị trí", en: "Role questions" },
      includeJobFields: true,
      fields: [],
    },
    {
      id: "consent",
      title: { vi: "Xác nhận", en: "Confirmation" },
      includeJobFields: false,
      fields: [
        {
          id: "consent",
          type: "checkbox",
          label: {
            vi: "Tôi đồng ý cho công ty lưu trữ hồ sơ để phục vụ tuyển dụng.",
            en: "I agree that the company may store my application for recruitment purposes.",
          },
          required: true,
          fullWidth: true,
        },
      ],
    },
  ],
  submitLabel: { vi: "Gửi hồ sơ ứng tuyển", en: "Submit application" },
  successTitle: { vi: "Đã nhận hồ sơ của bạn", en: "Application received" },
  successBody: {
    vi: "Cảm ơn bạn đã ứng tuyển. Đội ngũ nhân sự sẽ phản hồi trong vòng 5 ngày làm việc.",
    en: "Thanks for applying. Our people team will get back to you within five working days.",
  },
};

export function createField(type: FieldType = "text"): FormField {
  const id = `field_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    type,
    label: { vi: "Câu hỏi mới", en: "New question" },
    required: false,
    fullWidth: type === "textarea" || type === "checkbox" || type === "file",
    ...(type === "select" ? { options: [{ vi: "Lựa chọn 1", en: "Option 1" }] } : {}),
  };
}

export function createSection(): FormSection {
  return {
    id: `section_${Math.random().toString(36).slice(2, 8)}`,
    title: { vi: "Phần mới", en: "New section" },
    includeJobFields: false,
    fields: [],
  };
}

/** Turns a job's role-specific question into the shared form field shape. */
export function fromDynamicField(field: DynamicField): FormField {
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

/**
 * Resolves the sections shown on the apply form: role-specific questions are
 * appended to the section with `includeJobFields`, then empty sections are
 * dropped. Shared by the public apply page and the admin preview dialog so
 * both always render the same structure.
 */
export function resolveFormSections(
  config: FormConfig,
  job: Pick<Job, "extraFields">,
): (FormSection & { resolved: FormField[] })[] {
  return config.sections
    .map((section) => ({
      ...section,
      resolved: section.includeJobFields
        ? [...section.fields, ...job.extraFields.map(fromDynamicField)]
        : section.fields,
    }))
    .filter((section) => section.resolved.length > 0);
}

function isFormConfigLike(value: unknown): value is FormConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<FormConfig>;
  return Array.isArray(v.sections) && !!v.submitLabel;
}

type FormConfigValue = {
  ready: boolean;
  formConfig: FormConfig;
};

const FormConfigContext = createContext<FormConfigValue | null>(null);

export function FormConfigProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [formConfig, setFormConfig] = useState<FormConfig>(defaultFormConfig);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/form-config");
        const body = (await response.json()) as {
          success: boolean;
          data?: Partial<FormConfig>;
          error?: string;
        };
        if (cancelled || !response.ok || body?.success === false || !body.data) return;
        const parsed = body.data;
        if (isFormConfigLike(parsed)) {
          setFormConfig({ ...defaultFormConfig, ...parsed });
        }
      } catch {
        /* API not available — keep defaults */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<FormConfigValue>(
    () => ({ ready, formConfig }),
    [ready, formConfig],
  );

  return <FormConfigContext.Provider value={value}>{children}</FormConfigContext.Provider>;
}

export function useFormConfig() {
  const ctx = useContext(FormConfigContext);
  if (!ctx) throw new Error("useFormConfig must be used inside FormConfigProvider");
  return ctx;
}
