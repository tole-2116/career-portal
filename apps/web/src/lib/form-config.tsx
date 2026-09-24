import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Localized } from "@/lib/i18n";

const STORAGE_KEY = "talenthub-form-config";

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

function isFormConfigLike(value: unknown): value is FormConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<FormConfig>;
  return Array.isArray(v.sections) && !!v.submitLabel;
}

type FormConfigValue = {
  formConfig: FormConfig;
  saveFormConfig: (next: FormConfig) => void;
  resetFormConfig: () => void;
};

const FormConfigContext = createContext<FormConfigValue | null>(null);

export function FormConfigProvider({ children }: { children: ReactNode }) {
  const [formConfig, setFormConfig] = useState<FormConfig>(defaultFormConfig);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (isFormConfigLike(parsed)) setFormConfig({ ...defaultFormConfig, ...parsed });
    } catch {
      /* ignore malformed stored config */
    }
  }, []);

  const saveFormConfig = useCallback((next: FormConfig) => {
    setFormConfig(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const resetFormConfig = useCallback(() => {
    setFormConfig(defaultFormConfig);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<FormConfigValue>(
    () => ({ formConfig, saveFormConfig, resetFormConfig }),
    [formConfig, saveFormConfig, resetFormConfig],
  );

  return <FormConfigContext.Provider value={value}>{children}</FormConfigContext.Provider>;
}

export function useFormConfig() {
  const ctx = useContext(FormConfigContext);
  if (!ctx) throw new Error("useFormConfig must be used inside FormConfigProvider");
  return ctx;
}
