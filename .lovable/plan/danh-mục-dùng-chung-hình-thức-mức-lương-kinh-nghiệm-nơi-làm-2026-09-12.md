# Danh mục dùng chung: Hình thức, Mức lương, Kinh nghiệm, Nơi làm việc

Mục tiêu: HR khai báo sẵn 4 danh mục, sau đó khi đăng tin chỉ cần chọn từ danh sách thay vì gõ tay, và bộ lọc ở trang Việc làm dùng đúng danh mục này.

## 1. Trang quản trị mới: Danh mục (/admin/taxonomies)

Thêm mục "Danh mục" vào thanh điều hướng quản trị. Trang gồm 4 thẻ:

- **Hình thức làm việc** (Toàn thời gian, Bán thời gian, Thực tập, Kết hợp từ xa…)
- **Mức lương** (ví dụ: Thỏa thuận, 10 – 15 triệu, 15 – 25 triệu, Trên 50 triệu…)
- **Kinh nghiệm** (Chưa yêu cầu, Dưới 1 năm, 1 – 3 năm, 3 – 5 năm, Trên 5 năm)
- **Nơi làm việc** (Hà Nội, TP. Hồ Chí Minh, Đà Nẵng…)

Mỗi thẻ: thêm dòng mới, sửa tên tiếng Việt và tiếng Anh, đổi thứ tự lên/xuống, xóa, và nút khôi phục danh sách mặc định. Có ghi chú số tin đang dùng mỗi mục để tránh xóa nhầm.

## 2. Biểu mẫu đăng tin (/admin/jobs)

- Bốn ô Hình thức, Mức lương, Kinh nghiệm, Nơi làm việc chuyển từ nhập tay song ngữ sang **chọn từ danh mục**.
- Mỗi ô có thêm lựa chọn "Nhập giá trị khác…" để gõ tự do khi cần, và tùy chọn lưu giá trị đó vào danh mục.
- Tin cũ có giá trị không nằm trong danh mục vẫn giữ nguyên và hiển thị bình thường.

## 3. Trang Việc làm (/jobs)

- Bộ lọc Hình thức, Nơi làm việc, Cấp bậc lấy lựa chọn từ danh mục (thay vì suy ra từ các tin hiện có), bổ sung **bộ lọc Mức lương** và **bộ lọc Kinh nghiệm** (bật/tắt được trong Cấu hình giao diện → Trang việc làm).
- Chỉ hiện các mục thực sự có tin, để không có bộ lọc rỗng.

## Chi tiết kỹ thuật

- Thêm `src/lib/taxonomy-store.tsx`: type `TaxonomyItem { id, label: Localized }`, 4 danh sách `workTypes`, `salaries`, `experiences`, `locations`, lưu localStorage khóa `talenthub-taxonomies`, cung cấp `useTaxonomies()` với `addItem/updateItem/moveItem/removeItem/reset`. Giá trị mặc định sinh từ dữ liệu mẫu trong `src/data/jobs.ts`.
- Đăng ký provider trong `src/routes/__root.tsx` (bọc ngoài `JobsProvider`).
- `src/data/jobs.ts`: `experience` chuyển sang dùng `Localized` chọn từ danh mục (đã là `Localized`, giữ nguyên type).
- Route mới `src/routes/admin.taxonomies.tsx` + thêm mục vào `src/components/admin/AdminLayout.tsx`; head() riêng có title/description.
- `src/routes/admin.jobs.tsx`: thay `BilingualField` bằng component `TaxonomySelect` cho 4 trường, kèm chế độ nhập tự do.
- `src/routes/jobs.index.tsx`: nguồn lựa chọn lọc lấy từ taxonomy giao với `facetOptions`; thêm 2 bộ lọc mới.
- `src/lib/site-config.tsx`: thêm cờ `filters.salary`, `filters.experience` trong `jobsPage`, merge tương thích ngược.
- `src/lib/i18n.tsx`: thêm khóa dịch cho trang Danh mục và 2 bộ lọc mới.
- Kiểm tra bằng typecheck và chạy thử trình duyệt: /admin/taxonomies, /admin/jobs, /jobs.

## Giới hạn

Danh mục vẫn lưu trên trình duyệt đang dùng, giống dữ liệu tin tuyển dụng. Muốn dùng chung cho cả công ty cần bật cơ sở dữ liệu.
