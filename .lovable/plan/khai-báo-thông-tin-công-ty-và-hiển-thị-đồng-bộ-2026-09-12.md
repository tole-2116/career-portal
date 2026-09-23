# Khai báo thông tin công ty và hiển thị đồng bộ

HR sẽ khai báo thông tin liên hệ của công ty một lần trong **Cấu hình giao diện → Thương hiệu**, và thông tin đó hiển thị đồng bộ ở chân trang, trang giới thiệu và các nơi cần liên hệ.

## HR khai báo được những gì

- Tên đầy đủ công ty (đã có) và **giới thiệu ngắn** (song ngữ) — đoạn mô tả cạnh logo ở chân trang.
- **Địa chỉ** (song ngữ, cho phép nhiều dòng), có thể thêm nhiều chi nhánh (tên chi nhánh + địa chỉ).
- **Email tuyển dụng**, **số điện thoại**, **website**.
- **Mã số thuế / tên pháp nhân** (tùy chọn, để trống thì ẩn).
- **Liên kết mạng xã hội**: Facebook, LinkedIn, YouTube, GitHub — nhập link, để trống thì ẩn biểu tượng.
- **Dòng bản quyền** tự sinh: © năm + tên công ty + "Bảo lưu mọi quyền" (có thể sửa).

Mỗi mục trống sẽ tự ẩn, không để lại khoảng trắng.

## Hiển thị ở đâu

- **Chân trang**: bố cục 3 cột theo mẫu bạn gửi — logo + tên + giới thiệu ngắn + biểu tượng mạng xã hội | Liên kết nhanh | Liên hệ (địa chỉ, email, điện thoại có biểu tượng). Dải bản quyền bên dưới.
- **Trang giới thiệu**: khối thông tin liên hệ và danh sách văn phòng lấy từ cấu hình.
- **Trang chi tiết việc làm / ứng tuyển**: dòng liên hệ bộ phận tuyển dụng (email) khi đã khai báo.
- **Khu quản trị**: tên công ty ở thanh bên (đã có).

## Chi tiết kỹ thuật

- Thêm `company` vào `SiteConfig` trong `src/lib/site-config.tsx`: `intro: Localized`, `locations: { id, name: Localized, address: Localized }[]`, `email`, `phone`, `website`, `legalName`, `taxId`, `social: { facebook, linkedin, youtube, github }`, `copyright: Localized`. Bổ sung mặc định và hợp nhất trong `mergeConfig()` để cấu hình đã lưu không thiếu trường.
- `src/routes/admin.settings.tsx`: thêm khối "Thông tin công ty" trong tab Thương hiệu, gồm trình soạn danh sách chi nhánh (thêm/xóa/di chuyển) dùng các thành phần sẵn có.
- `src/components/site/SiteFooter.tsx`: dựng lại theo bố cục 3 cột, biểu tượng `lucide-react` (`MapPin`, `Mail`, `Phone`, `Facebook`, `Linkedin`, `Youtube`, `Github`), chỉ render mục có dữ liệu; dùng token màu sẵn có, không hardcode màu.
- `src/routes/about.tsx`: thay dữ liệu liên hệ cố định bằng dữ liệu từ config.
- Thêm khóa dịch mới vào `src/lib/i18n.tsx`.
- Cập nhật `head()` của trang chủ dùng tên công ty đã khai báo cho tiêu đề/mô tả.

## Ngoài phạm vi

Cấu hình vẫn lưu trên trình duyệt của người đang dùng, chưa đồng bộ cho mọi khách truy cập. Khi cần lưu thật cho cả tổ chức, bật Lovable Cloud để lưu vào cơ sở dữ liệu.
