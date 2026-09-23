# Khu cấu hình thương hiệu doanh nghiệp

Thêm một tab **Thương hiệu** trong trang cấu hình của HR, nơi bạn nhập tên công ty, khẩu hiệu, chọn hoặc tải logo, chọn màu thương hiệu — rồi bấm Lưu để trang chủ, đầu trang, chân trang và khu quản trị đổi theo ngay.

## Những gì sẽ có

### Tab Thương hiệu (mới, đặt đầu tiên)
- **Tên công ty** và **khẩu hiệu ngắn**, song ngữ Việt/Anh.
- **Logo**: ba cách chọn
  - Tải logo từ máy (PNG/SVG/JPG, tối đa 1MB) — lưu cùng cấu hình trên trình duyệt.
  - Chọn từ thư viện logo mẫu (sẽ thiết kế thêm 3 mẫu logo chữ lồng hiện đại theo tông navy/hổ phách).
  - Dán đường dẫn ảnh logo có sẵn.
  - Nếu chưa có logo, hệ thống tự hiển thị chữ cái đầu của tên công ty trong ô vuông màu thương hiệu.
- **Màu thương hiệu**: chọn bảng màu dựng sẵn hoặc tự chọn màu chủ đạo + màu nhấn bằng bộ chọn màu; có ô xem trước ngay.
- **Xem trước trực tiếp**: khung nhỏ mô phỏng đầu trang + nút chính theo thương hiệu đang chỉnh.

### Áp dụng thương hiệu ra toàn hệ thống
- Đầu trang và chân trang trang tuyển dụng: hiện logo và tên công ty đã cấu hình thay vì chữ cố định.
- Thanh bên khu quản trị: logo và tên công ty thay cho ô "TH" và chữ TalentHub.
- Khẩu hiệu hiển thị dưới tên công ty ở chân trang.
- Màu chủ đạo/nhấn tiếp tục áp cho nút, thẻ, biểu đồ như hiện nay.
- Tiêu đề trình duyệt của trang chủ dùng tên công ty đã cấu hình.

### Lưu cấu hình
Giữ nguyên cách lưu hiện tại: lưu trên trình duyệt của bạn (nút Lưu / Khôi phục mặc định). Logo tải lên được nén nhẹ trước khi lưu để không vượt dung lượng cho phép.

## Chi tiết kỹ thuật

- `src/lib/site-config.tsx`: thêm `copy.tagline` (Localized) và `brand.logoMode`/`images.logo` nhận cả data URL; mở rộng `mergeConfig()` để cấu hình cũ vẫn đọc được; giới hạn kích thước logo khi ghi localStorage và bắt lỗi quota.
- `src/data/media.ts`: thêm 3 logo mẫu mới sinh bằng image generation (nền trong suốt, PNG) vào `logoLibrary`.
- `src/routes/admin.settings.tsx`: thêm tab `brand` với các trường tên/khẩu hiệu song ngữ, `BrandLogoPicker` (upload qua `<input type="file">` → `FileReader` → data URL, thư viện, URL thủ công), bộ chọn màu tái dùng phần palette hiện có, và khối xem trước.
- `src/components/site/SiteHeader.tsx`, `SiteFooter.tsx`, `src/components/admin/AdminLayout.tsx`: đọc `useSiteConfig()` để render logo + tên; fallback chữ cái đầu khi không có logo.
- `src/lib/i18n.tsx`: thêm khóa dịch cho tab và nhãn mới.
- `src/routes/index.tsx`: tiêu đề/mô tả trang dùng tên công ty từ cấu hình (giữ nguyên các thẻ head khác).
- Không đổi dữ liệu việc làm/ứng viên, không thêm thư viện mới.
