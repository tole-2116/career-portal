# Làm mới giao diện toàn hệ thống

Giữ nguyên toàn bộ chức năng hiện có (5 bố cục trang chủ, cấu hình giao diện, form builder, khu quản trị). Chỉ thay đổi phần nhìn: màu sắc, phông chữ, khoảng cách, kiểu thẻ, nút, bảng biểu và chuyển động.

## Hướng thiết kế đã chốt

- Màu: Navy sâu `#1B2A41`, nền kem `#F5F3EF`, nhấn hổ phách `#E8A33D`, xanh phụ `#2F4A6D`
- Chữ: tiêu đề Space Grotesk, nội dung DM Sans
- Bố cục chính: lưới hero — hero lớn chiếm trên, lưới thẻ bên dưới

## Những gì sẽ thay đổi

### Nền tảng hình ảnh
- Cập nhật bộ màu và phông cho cả chế độ sáng/tối, thêm sắc độ phụ, bóng đổ mềm nhiều lớp, viền tinh và bo góc thống nhất.
- Nạp Space Grotesk + DM Sans; chuẩn hóa cỡ chữ, độ đậm và giãn dòng cho tiêu đề/nội dung.
- Chuẩn hóa nút, thẻ, nhãn trạng thái, ô nhập liệu: trạng thái di chuột và tiêu điểm rõ ràng hơn, chuyển động nhẹ.

### Trang tuyển dụng
- Đầu trang: gọn hơn, nền mờ khi cuộn, điều hướng và nút ứng tuyển nổi bật hơn.
- Trang chủ: hero lưới với ảnh lớn, ô tìm kiếm nổi, dải số liệu tinh gọn; các khu văn hóa/phúc lợi dùng thẻ nhất quán. Bốn bố cục còn lại cũng được chỉnh theo cùng ngôn ngữ thiết kế.
- Danh sách việc làm: bộ lọc gọn gàng hơn, thẻ việc làm rõ phân cấp (chức danh, phòng ban, địa điểm, nhãn).
- Chi tiết công việc: bố cục hai cột với khối thông tin dính bên phải, nội dung dễ đọc hơn.
- Ứng tuyển: form chia bước rõ ràng, vùng tải CV dạng kéo thả trực quan, thông báo thành công đẹp hơn.
- Chân trang: sắp xếp lại thành các cột gọn.

### Khu quản trị HR
- Thanh bên: biểu tượng rõ, trạng thái đang chọn nổi bật, thu gọn được trên màn nhỏ.
- Bảng điều khiển: thẻ chỉ số có xu hướng tăng/giảm, biểu đồ đổi màu theo bộ màu mới.
- Bảng việc làm/ứng viên: hàng thưa hơn, nhãn trạng thái màu riêng, thanh công cụ tìm kiếm/lọc thống nhất.
- Trang cấu hình và form builder: giữ nguyên cấu trúc thẻ, làm gọn khoảng cách và nhóm trường cho dễ nhìn.

## Chi tiết kỹ thuật

- `src/styles.css`: viết lại token màu `:root`/`.dark` sang oklch tương ứng bảng màu đã chọn, cập nhật `--font-sans`/`--font-display`, thêm token bóng đổ và gradient.
- `src/routes/__root.tsx`: đổi `<link>` Google Fonts sang Space Grotesk + DM Sans.
- `src/lib/site-config.tsx`: cập nhật preset bảng màu mặc định khớp hướng mới (giữ nguyên cấu trúc config để cấu hình đã lưu không vỡ).
- Tinh chỉnh class trình bày trong `src/components/site/*`, `src/components/home/*`, `src/components/admin/AdminLayout.tsx`, `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/card.tsx` và các route trong `src/routes/`.
- Không đổi logic dữ liệu, không đổi kiểu `SiteConfig`/`FormConfig`, không thêm thư viện mới ngoài phông chữ.
- Kiểm tra lại bằng typecheck và chụp màn hình các trang chính ở cả desktop và mobile.
