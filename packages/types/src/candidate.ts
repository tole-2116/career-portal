import { z } from "zod";

export const ApplyJobSchema = z.object({
  jobId: z.string().min(1),
  name: z.string().min(2, "Tên ứng viên quá ngắn"),
  email: z.string().email("Email không đúng định dạng"),
  phone: z.string().min(8, "Số điện thoại không hợp lệ"),
  coverLetter: z.string().optional(),
});

export type ApplyJobInput = z.infer<typeof ApplyJobSchema>;
