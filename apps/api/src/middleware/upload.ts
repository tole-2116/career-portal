import fs from "node:fs";
import path from "node:path";
import multer from "multer";

/** Thư mục lưu file upload — cạnh app api (apps/api/uploads). */
export const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// Đảm bảo thư mục tồn tại trước khi multer ghi file.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `news-${unique}${ext}`);
  },
});

/** Chỉ nhận file ảnh, tối đa 1MB (khớp giới hạn ở frontend). */
export const uploadCover = multer({
  storage,
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});
