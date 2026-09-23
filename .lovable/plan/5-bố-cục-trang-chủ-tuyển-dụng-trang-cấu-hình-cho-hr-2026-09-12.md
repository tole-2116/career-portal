# 5 bố cục trang chủ tuyển dụng + trang cấu hình cho HR

Thêm 5 kiểu trang chủ cổng việc làm khác nhau, kèm một trang cấu hình trong bảng điều khiển HR để chọn bố cục, đổi bảng màu, thay hình ảnh và sửa nội dung chữ. Cấu hình lưu ngay trên trình duyệt và áp dụng tức thì cho trang chủ.

## 5 bố cục trang chủ

Tất cả đều song ngữ Việt – Anh và dùng chung dữ liệu việc làm hiện có.

1. **Cổ điển doanh nghiệp** — ảnh bìa lớn với ô tìm việc nổi ở giữa, dải số liệu, giá trị văn hóa, việc làm nổi bật.
2. **Chia đôi màn hình** — nửa trái là thông điệp và ô tìm việc, nửa phải là ảnh đội ngũ; bên dưới là lưới việc làm.
3. **Lưới ô vuông (bento)** — các ô kích thước khác nhau: thông điệp, ảnh, số liệu, phúc lợi, vài vị trí đang tuyển.
4. **Tối giản kiểu tạp chí** — tiêu đề lớn, nhiều khoảng trắng, danh sách việc làm dạng dòng kẻ, một ảnh lớn duy nhất.
5. **Nền tối nổi bật** — nền tối, màu nhấn rực, ảnh phủ mờ, thẻ việc làm tương phản cao.

## Trang cấu hình cho HR (`/admin/settings`)

- **Bố cục**: 5 thẻ xem trước thu nhỏ, bấm để chọn, có đánh dấu bố cục đang dùng.
- **Bảng màu**: 6 bộ màu dựng sẵn (Navy tin cậy, Xanh ngọc sang trọng, Than & lửa, Trắng mây, Cát ấm, Xanh đại dương) hiển thị dạng ô màu, kèm ô tự chọn màu chủ đạo và màu nhấn.
- **Hình ảnh**: ảnh bìa, ảnh văn hóa công ty, logo — chọn từ thư viện ảnh minh họa có sẵn hoặc dán đường dẫn ảnh; có xem trước.
- **Nội dung chữ**: tên thương hiệu, tiêu đề chính, khẩu hiệu, mô tả ngắn, chữ trên nút — nhập riêng cho tiếng Việt và tiếng Anh.
- Nút **Xem trang chủ**, **Lưu** và **Khôi phục mặc định**; thông báo xác nhận sau khi lưu.

## Hình ảnh minh họa

Tạo sẵn một bộ ảnh minh họa cho thư viện: 3 ảnh bìa (văn phòng sáng, đội ngũ họp nhóm, không gian làm việc tối), 2 ảnh văn hóa công ty, 1 logo. Mỗi bố cục có ảnh mặc định phù hợp.

## Chi tiết kỹ thuật

- `src/lib/site-config.tsx`: kiểu `SiteConfig` (layout, palette, images, bilingual copy), context + provider, giá trị mặc định, lưu/đọc `localStorage` key `talenthub-site-config`, tránh lệch khi dựng trang trên máy chủ bằng cách chỉ đọc sau khi trình duyệt hiển thị.
- Bảng màu áp dụng bằng cách ghi biến CSS (`--primary`, `--accent`, `--background`, `--sidebar`…) lên phần tử gốc; không thêm class màu cứng.
- `src/components/home/` chứa 5 component bố cục; `src/routes/index.tsx` chọn component theo cấu hình.
- Ảnh sinh bằng công cụ tạo ảnh, lưu trong `src/assets/`, import ES6; thư viện ảnh khai báo trong `src/data/media.ts`.
- Route mới `src/routes/admin.settings.tsx`, thêm mục "Cấu hình" vào thanh điều hướng của `AdminLayout`; đặt `robots: noindex` như các trang admin khác.
- Bổ sung khóa dịch mới vào `src/lib/i18n.tsx`.

## Ngoài phạm vi

Cấu hình chỉ lưu trên trình duyệt của người đang dùng, chưa đồng bộ cho mọi khách truy cập. Khi cần lưu thật, bật Lovable Cloud và chuyển sang lưu trong cơ sở dữ liệu.
