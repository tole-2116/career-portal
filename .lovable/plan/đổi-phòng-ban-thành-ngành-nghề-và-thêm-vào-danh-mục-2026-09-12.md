# Đổi "Phòng ban" thành "Ngành nghề" và thêm vào Danh mục

## 1. Đổi tên hiển thị

Mọi nơi đang ghi "Phòng ban" / "Department" sẽ đổi thành "Ngành nghề" / "Industry":

- Bộ lọc trên trang Việc làm
- Cột và biểu mẫu trong trang quản trị Tin tuyển dụng
- Mục bật/tắt bộ lọc trong Cấu hình giao diện → Trang việc làm
- Mô tả phụ đề trang Việc làm

Nội dung tin hiện có (Công nghệ, Thiết kế, Nhân sự, Kinh doanh, Marketing, Vận hành) giữ nguyên, chỉ đổi cách gọi.

## 2. Thêm danh mục "Ngành nghề"

Trang Danh mục (/admin/taxonomies) có thêm thẻ thứ 5: **Ngành nghề**, hoạt động giống 4 thẻ hiện có — thêm dòng, sửa tên Việt/Anh, đổi thứ tự, xóa, hiển thị số tin đang dùng, và nằm trong nút khôi phục mặc định chung.

Danh sách mặc định: Công nghệ, Thiết kế, Nhân sự, Kinh doanh, Marketing, Vận hành.

## 3. Đăng tin và lọc

- Trong /admin/jobs, ô Ngành nghề chuyển từ nhập tay song ngữ sang **chọn từ danh mục**, vẫn có "Nhập giá trị khác…" và tùy chọn lưu giá trị mới vào danh mục (giống Hình thức, Mức lương…).
- Bộ lọc Ngành nghề ở /jobs lấy thứ tự theo danh mục, chỉ hiện mục thực sự có tin; giá trị cũ không nằm trong danh mục vẫn hiển thị.

## Chi tiết kỹ thuật

- `src/lib/taxonomy-store.tsx`: thêm khóa `departments` vào `TaxonomyKey`, `taxonomyKeys`, `defaultTaxonomies` và phần đọc/chuẩn hóa localStorage (khóa cũ thiếu trường này sẽ rơi về mặc định).
- `src/routes/admin.taxonomies.tsx`: thêm nhóm `{ key: "departments", label: "taxonomy.departments", field: "department" }`.
- `src/routes/admin.jobs.tsx`: thay `BiField` cho `department` bằng `TaxonomyField` với key `departments`.
- `src/routes/jobs.index.tsx`: facet ngành nghề dựng từ `mergeOptions(taxonomies.departments, …)` thay vì chỉ `facetOptions`.
- `src/lib/i18n.tsx`: đổi text các khóa `jobs.filter.department`, `admin.jobs.col.department`, `jobs.subtitle`; thêm `taxonomy.departments`.
- Giữ nguyên tên trường dữ liệu `department` trong `src/data/jobs.ts` để không phá dữ liệu đã lưu.
- Kiểm tra bằng typecheck và chạy thử /admin/taxonomies, /admin/jobs, /jobs.

## Giới hạn

Danh mục vẫn lưu trên trình duyệt đang dùng, giống dữ liệu tin tuyển dụng.
