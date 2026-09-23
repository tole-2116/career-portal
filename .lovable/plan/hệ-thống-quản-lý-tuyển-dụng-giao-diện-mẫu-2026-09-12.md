# Hệ thống Quản lý Tuyển dụng — giao diện mẫu

Xây dựng giao diện đầy đủ (dữ liệu mẫu, chưa nối cơ sở dữ liệu) cho hai phân hệ: Cổng việc làm cho ứng viên và Bảng điều khiển cho HR. Hiển thị song ngữ Việt – Anh với nút chuyển đổi trên đầu trang.

## Trước khi dựng: chọn phong cách

Tôi sẽ tạo 3 phương án thiết kế được dựng sẵn để bạn xem và chọn, rồi mới xây toàn bộ theo phương án bạn thích.

## Cổng thông tin việc làm

- **Trang chủ** (`/`): phần mở đầu giới thiệu công ty, ô tìm kiếm việc làm ngay trên đầu, khối văn hóa & giá trị, phúc lợi, vài vị trí nổi bật, lời kêu gọi ứng tuyển.
- **Danh sách việc làm** (`/jobs`): tìm theo từ khóa, lọc theo phòng ban, địa điểm, hình thức làm việc; danh sách thẻ công việc.
- **Chi tiết công việc** (`/jobs/:id`): mô tả, yêu cầu, quyền lợi, thông tin lương – địa điểm – hạn nộp, nút ứng tuyển nổi bật.
- **Biểu mẫu ứng tuyển động** (`/jobs/:id/apply`): các bước rõ ràng, trường thông tin thay đổi theo từng vị trí (ví dụ vị trí kỹ thuật hỏi thêm link GitHub, vị trí thiết kế hỏi portfolio), tải lên CV bằng kéo–thả kèm kiểm tra định dạng và dung lượng, xác nhận gửi thành công.
- **Giới thiệu công ty** (`/about`): văn hóa, đội ngũ, môi trường làm việc.

## Bảng điều khiển HR

Khu vực riêng có thanh điều hướng bên trái:

- **Tổng quan** (`/admin`): số tin đang tuyển, ứng viên mới, hồ sơ cần xử lý, biểu đồ ứng tuyển theo thời gian, hoạt động gần đây.
- **Tin tuyển dụng** (`/admin/jobs`): bảng danh sách, trạng thái đang mở / tạm dừng / đã đóng, tạo và sửa tin trong hộp thoại.
- **Ứng viên** (`/admin/candidates`): bảng lọc theo vị trí và giai đoạn, tìm kiếm, xem hồ sơ chi tiết gồm thông tin, CV, ghi chú và đánh giá, đổi trạng thái hồ sơ.

## Chi tiết kỹ thuật

- TanStack Start + React, mỗi trang là một route riêng với tiêu đề và mô tả SEO riêng.
- Bảng màu, phông chữ, bo góc lấy từ phương án thiết kế được chọn, khai báo làm token trong `src/styles.css`; component dùng shadcn/ui.
- Dữ liệu mẫu tập trung trong `src/data/` (việc làm, ứng viên, cấu hình trường động theo vị trí) để sau này thay bằng dữ liệu thật dễ dàng.
- Song ngữ: từ điển `src/lib/i18n` + context ngôn ngữ, lưu lựa chọn trong trình duyệt.
- Biểu mẫu dùng react-hook-form + zod, giới hạn CV ở PDF/DOC/DOCX và dung lượng tối đa; file chỉ giữ tạm ở trình duyệt vì chưa có lưu trữ.
- Bố cục đáp ứng: thanh điều hướng thu gọn trên di động, bảng chuyển thành thẻ ở màn hình nhỏ.

## Ngoài phạm vi bản này

Đăng nhập HR thật, lưu hồ sơ và tệp CV trên máy chủ, gửi email tự động — sẽ bổ sung khi bạn muốn chuyển sang chạy thật với Lovable Cloud.
