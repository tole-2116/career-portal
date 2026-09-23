# Nhiều nơi làm việc, icon mạng xã hội, và nhập liệu đa ngôn ngữ

## 1. Tin tuyển dụng chọn nhiều nơi làm việc

Hiện mỗi tin chỉ có một địa điểm.

- Trong màn hình tạo/sửa tin: ô "Nơi làm việc" đổi thành chọn nhiều mục từ danh mục Nơi làm việc (tick nhiều dòng, có thể thêm giá trị mới như hiện nay).
- Trang việc làm: thẻ tin hiển thị danh sách địa điểm (rút gọn "Hà Nội, TP.HCM +1"), bộ lọc địa điểm khớp nếu tin có chứa địa điểm được chọn.
- Trang chi tiết tin hiển thị đầy đủ các địa điểm.
- Tin cũ chỉ có một địa điểm vẫn hiển thị bình thường (tự chuyển thành danh sách một phần tử).

## 2. Icon mạng xã hội trên trang chủ

Hiện các icon chỉ xuất hiện ở chân trang và chỉ khi đã điền đường dẫn, nên đang trống.

- Phần Liên hệ/Thông tin công ty trong trang cấu hình được đánh dấu rõ là nguồn hiển thị icon, kèm dòng nhắc "để trống sẽ không hiển thị".
- Bổ sung hiển thị icon mạng xã hội trên trang chủ (dải cuối trang chủ, cạnh nút kêu gọi ứng tuyển) và ở chân trang như hiện tại.
- Thêm hai kênh phổ biến: Zalo và TikTok, bên cạnh Facebook, LinkedIn, YouTube, GitHub.
- Điền sẵn đường dẫn mẫu để thấy ngay giao diện; người dùng thay bằng liên kết thật.

## 3. Danh sách ngôn ngữ cấu hình được + nhập theo tab

- Thêm mục "Ngôn ngữ" trong trang cấu hình: bật/tắt các ngôn ngữ (Tiếng Việt, English, 한국어, 日本語, 中文), chọn ngôn ngữ mặc định, sắp xếp thứ tự. Tiếng Việt luôn bật.
- Mọi màn hình nhập dữ liệu song ngữ (tin tuyển dụng, danh mục, cấu hình trang chủ, biểu mẫu ứng tuyển, thông tin công ty) chuyển từ hai ô cạnh nhau sang **tab theo ngôn ngữ**: Tiếng Việt | English | 한국어 ... đúng theo danh sách đã bật.
- Nút chuyển ngôn ngữ ở đầu trang hiển thị đúng các ngôn ngữ đã bật.
- Nội dung thiếu ở một ngôn ngữ sẽ tự hiển thị theo ngôn ngữ mặc định để trang không bị trống.

## Chi tiết kỹ thuật

- `Job.location: Localized` → `locations: Localized[]`, chuẩn hoá dữ liệu cũ trong `jobs-store`; cập nhật `JobCard`, `jobs.index.tsx` (facet + filter), `jobs.$jobId.index.tsx`, `admin.jobs.tsx` (multi-select taxonomy).
- `Localized` đổi thành `Record<string, string>` với `vi` bắt buộc; `tr()` fallback theo ngôn ngữ mặc định rồi tới `vi`. Thêm `languages: { code, enabled, order }[]` vào `SiteConfig` với merge tương thích ngược.
- Tạo component dùng chung `LocalizedTabsField` / `LocalizedTabsList` thay cho `BiField` / `BiListField` ở `admin.jobs.tsx`, `admin.taxonomies.tsx`, `admin.forms.tsx`, `admin.settings.tsx`.
- `CompanyInfo.social` thêm `zalo`, `tiktok`; thêm khối social vào `components/home/shared.tsx` để 5 bố cục trang chủ dùng chung.
- Dữ liệu vẫn lưu trong trình duyệt như hiện tại.
