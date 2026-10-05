import type { FormConfigDto } from "../services/admin-form-config.service";

export const defaultFormConfig: FormConfigDto = {
  code: "application-form",
  name: "Biểu mẫu ứng tuyển",
  sections: [
    {
      id: "profile",
      title: { vi: "Thông tin cá nhân", en: "Your details" },
      includeJobFields: false,
      fields: [
        { id: "fullName", type: "text", label: { vi: "Họ và tên", en: "Full name" }, required: true, fullWidth: false, maxLength: 100 },
        { id: "email", type: "email", label: { vi: "Email", en: "Email" }, required: true, fullWidth: false, maxLength: 255 },
        { id: "phone", type: "tel", label: { vi: "Số điện thoại", en: "Phone number" }, required: true, fullWidth: false, maxLength: 20 },
        { id: "city", type: "text", label: { vi: "Nơi ở hiện tại", en: "Current location" }, required: false, fullWidth: false, maxLength: 100 },
        { id: "linkedin", type: "url", label: { vi: "LinkedIn (không bắt buộc)", en: "LinkedIn (optional)" }, required: false, fullWidth: true, maxLength: 255 },
      ],
    },
    {
      id: "cv",
      title: { vi: "Hồ sơ & CV", en: "Resume & CV" },
      includeJobFields: false,
      fields: [
        { id: "cv", type: "file", label: { vi: "Tải lên CV", en: "Upload your CV" }, required: true, fullWidth: true },
        {
          id: "coverLetter",
          type: "textarea",
          label: { vi: "Thư giới thiệu", en: "Cover letter" },
          placeholder: { vi: "Vì sao bạn phù hợp với vị trí này?", en: "Why are you a good fit for this role?" },
          required: false,
          fullWidth: true,
          maxLength: 1000,
        },
      ],
    },
    { id: "extra", title: { vi: "Câu hỏi riêng cho vị trí", en: "Role questions" }, includeJobFields: true, fields: [] },
    {
      id: "consent",
      title: { vi: "Xác nhận", en: "Confirmation" },
      includeJobFields: false,
      fields: [{
        id: "consent",
        type: "checkbox",
        label: { vi: "Tôi đồng ý cho công ty lưu trữ hồ sơ để phục vụ tuyển dụng.", en: "I agree that the company may store my application for recruitment purposes." },
        required: true,
        fullWidth: true,
      }],
    },
  ],
  submitLabel: { vi: "Gửi hồ sơ ứng tuyển", en: "Submit application" },
  successTitle: { vi: "Đã nhận hồ sơ của bạn", en: "Application received" },
  successBody: {
    vi: "Cảm ơn bạn đã ứng tuyển. Đội ngũ nhân sự sẽ phản hồi trong vòng 5 ngày làm việc.",
    en: "Thanks for applying. Our people team will get back to you within five working days.",
  },
};
