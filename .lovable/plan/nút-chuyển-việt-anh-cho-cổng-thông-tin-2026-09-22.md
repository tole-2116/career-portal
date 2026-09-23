# Nút chuyển Việt–Anh cho cổng thông tin

## Thay đổi

- Giữ mặc định hệ thống gồm hai ngôn ngữ: Tiếng Việt và English.
- Tạo nút chuyển dạng Switch gọn trên đầu trang công khai, hiển thị rõ `VI` và `EN`; thao tác bật/tắt chuyển trực tiếp giữa hai ngôn ngữ.
- Áp dụng Switch cho toàn bộ cổng thông tin dùng chung đầu trang: Trang chủ, Việc làm, Về chúng tôi, Tin tức, Liên hệ và các trang ứng tuyển.
- Khu vực quản trị tiếp tục dùng danh sách thả xuống hiện tại để thuận tiện cho việc nhập và quản lý nội dung nhiều ngôn ngữ.
- Trên cổng thông tin, Switch chỉ dùng Việt/Anh kể cả khi quản trị đã bật thêm Hàn, Nhật hoặc Trung.
- Ghi nhớ lựa chọn Việt/Anh của khách truy cập như hiện nay và bảo đảm nút hiển thị tốt trên cả máy tính lẫn điện thoại.

## Chi tiết kỹ thuật

- Tách điều khiển công khai thành một thành phần Switch Việt–Anh riêng, dùng lại trạng thái từ `useI18n()`.
- Thay `LanguageToggle` trong `SiteHeader` bằng Switch mới; giữ nguyên `LanguageToggle` dạng dropdown trong `AdminLayout`.
- Giữ `defaultLanguageSettings.enabled = ["vi", "en"]`; không thay đổi các tab nhập liệu đa ngôn ngữ trong quản trị.
- Kiểm tra chuyển đổi ngôn ngữ và bố cục đầu trang ở kích thước desktop/mobile trên các trang công khai chính.
