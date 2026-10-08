import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập họ tên").max(100),
  email: z.string().trim().email("Email không hợp lệ").max(255),
  phone: z.string().trim().max(30).nullable().optional(),
  subject: z.string().trim().min(1, "Vui lòng nhập chủ đề").max(150),
  body: z.string().trim().min(10, "Nội dung tối thiểu 10 ký tự").max(2000),
});

export type ContactInput = z.infer<typeof ContactSchema>;
