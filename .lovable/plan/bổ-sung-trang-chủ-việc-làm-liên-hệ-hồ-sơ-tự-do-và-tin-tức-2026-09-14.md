# Bổ sung Trang chủ, Việc làm, Liên hệ, Hồ sơ tự do và Tin tức

## 1. Trang chủ — băng ảnh tự chạy (tối đa 5 ảnh)
- Cấu hình giao diện có danh sách ảnh Hero (thêm/xóa/sắp xếp, tối đa 5), giữ tương thích với 1 ảnh đang có.
- Trang chủ tự chuyển ảnh sau mỗi vài giây, có chấm chuyển ảnh, dừng khi rê chuột, tôn trọng chế độ giảm chuyển động.
- Chỉ 1 ảnh thì hiển thị tĩnh như hiện nay.

## 2. Hồ sơ tự do (không gắn vị trí)
- Khối "Không thấy vị trí phù hợp?" dẫn tới trang nộp hồ sơ tự do riêng, không còn dẫn về trang Việc làm.
- Dùng lại biểu mẫu động hiện có, bỏ phần thông tin vị trí.
- Admin > Ứng viên: thêm tab riêng "Hồ sơ tự do" tách khỏi tab ứng viên theo tin, kèm nhãn nhận diện và nút gán hồ sơ vào một tin tuyển dụng.

## 3. Trang Liên hệ riêng
- Thêm mục "Liên hệ" trên thanh menu và chân trang.
- Trang gồm thông tin công ty (địa chỉ các chi nhánh, email, điện thoại, mạng xã hội) lấy từ cấu hình, và form gửi liên hệ: họ tên, email, điện thoại, chủ đề, nội dung; có kiểm tra dữ liệu và giới hạn độ dài.
- Tin nhắn liên hệ hiển thị trong Admin (danh sách, đánh dấu đã xử lý).
- Trang Về chúng tôi giữ phần liên hệ rút gọn, có nút dẫn sang trang Liên hệ.

## 4. Trang Việc làm
- Đồng bộ tên gọi với danh mục Admin: "Địa điểm" → "Nơi làm việc", "Cấp bậc" → "Kinh nghiệm" (áp dụng cả trang chi tiết tin và phần cấu hình bộ lọc).
- Thêm sắp xếp: Mới nhất / Mức lương (cao → thấp, thấp → cao) / Liên quan nhất, giữ ưu tiên tin nổi bật ở chế độ mặc định.
- Tin "Tạm dừng" và "Đã đóng" ẩn hoàn toàn khỏi trang công khai; bỏ bộ lọc Trạng thái ở giao diện ứng viên; mở link trực tiếp tới tin đã ẩn sẽ báo tin không còn nhận hồ sơ và chặn nộp hồ sơ.

## 5. Module Tin tức (mới, có thể bật/tắt)
- Trang danh sách bài viết: ảnh bìa, tiêu đề, mô tả ngắn, ngày đăng, chuyên mục, lọc theo chuyên mục, phân trang.
- Trang chi tiết bài viết: ảnh bìa, nội dung, ngày, chuyên mục, bài liên quan, thông tin chia sẻ.
- Admin: quản lý bài viết (thêm/sửa/xóa, nháp/xuất bản, đặt nổi bật) và quản lý chuyên mục, nhập liệu theo tab ngôn ngữ như các màn hình khác.
- Công tắc bật/tắt module trong Cấu hình giao diện. Khi tắt: ẩn menu "Tin tức", ẩn khối tin tức trên trang chủ, và truy cập thẳng đường dẫn cũng bị chuyển về trang chủ.

## Ghi chú kỹ thuật
- Dữ liệu mới (bài viết, chuyên mục tin tức, hồ sơ tự do, tin nhắn liên hệ) dùng cùng cơ chế lưu cục bộ trong trình duyệt như các phần hiện có, theo mẫu `jobs-store` / `taxonomy-store`; chưa có cơ sở dữ liệu dùng chung cho mọi khách truy cập.
- Route mới: `/contact`, `/apply`, `/news`, `/news/$slug`, `/admin/news`; mỗi trang công khai có tiêu đề và mô tả riêng cho tìm kiếm.
- Bộ lọc trạng thái ở Admin giữ nguyên; chỉ giao diện công khai áp dụng quy tắc ẩn.
- Form liên hệ kiểm tra bằng zod (giới hạn độ dài, định dạng email).
