# Rà soát tốc độ tải & bảo mật

## Hiện trạng đã kiểm tra

- Thư mục ảnh nặng **3,4 MB**: riêng logo `brand-logo.png` 386 KB, 5 ảnh băng hero 172–290 KB mỗi ảnh, ảnh trang Về chúng tôi 89–223 KB.
- **Không có ảnh nào đặt tải chậm (lazy)**: tất cả ảnh tải ngay khi mở trang, kể cả ảnh nằm dưới màn hình.
- Băng ảnh trang chủ tải cả 5 ảnh ngay từ đầu.
- Trang quản trị Cấu hình (2.465 dòng) và trình soạn thảo bài viết nằm chung gói tải với trang công khai.
- Thư viện có **2 cảnh báo bảo mật mức cao** từ một gói phụ (js-yaml) bên trong khung TanStack Start — chưa có bản vá cho phiên bản đang dùng.
- Nội dung bài viết đã được làm sạch trước khi hiển thị (an toàn).
- Đăng nhập quản trị hiện chạy hoàn toàn trên trình duyệt: tài khoản, mật khẩu băm và phiên đăng nhập lưu trong bộ nhớ trình duyệt.

## Việc sẽ làm — Tốc độ tải

1. Nén mạnh toàn bộ ảnh trong `src/assets` (giữ nguyên hình, giảm dung lượng nhiều nhất có thể), mục tiêu giảm ~70% tổng dung lượng; logo PNG chuyển sang bản gọn.
2. Thêm tải chậm cho mọi ảnh không nằm ở đầu trang, giữ ảnh đầu tiên tải ưu tiên.
3. Băng ảnh trang chủ chỉ tải ảnh đầu ngay, các ảnh sau tải dần khi tới lượt.
4. Tách gói tải: khu quản trị và trình soạn thảo bài viết chỉ tải khi vào quản trị, không làm nặng trang công khai.
5. Đặt kích thước cố định cho ảnh để trang không bị giật layout khi ảnh về.

## Việc sẽ làm — Bảo mật (siết tạm thời, giữ đăng nhập hiện tại)

6. Kiểm tra lại dữ liệu người dùng mỗi lần nạp, chặn việc tự sửa bộ nhớ trình duyệt để nâng quyền.
7. Giới hạn số lần đăng nhập sai (khoá tạm sau nhiều lần thử liên tiếp).
8. Bỏ dòng gợi ý tài khoản mặc định `admin/admin123` trên màn hình đăng nhập.
9. Nhắc đổi mật khẩu khi tài khoản vẫn dùng mật khẩu mặc định.
10. Rà lại giới hạn tệp CV tải lên (loại tệp, dung lượng) và thông báo lỗi rõ ràng.
11. Ghi nhận cảnh báo thư viện; nâng cấp khung nếu đã có bản vá, chưa có thì theo dõi.

Lưu ý: khi nào trang chạy thật với dữ liệu quan trọng, nên chuyển đăng nhập sang máy chủ — các biện pháp trên chỉ làm khó, không chặn được hoàn toàn.

## Chi tiết kỹ thuật

- Ảnh: re-encode JPEG chất lượng ~72 bằng `ffmpeg`, thu về kích thước hiển thị tối đa (hero 1600w, gallery 1000w), logo PNG nén/thu về 512w.
- Lazy/async/kích thước: `HeroCarousel.tsx`, `about.tsx`, `news.index.tsx`, `news.$slug.tsx`, `Home*.tsx`, `BrandMark.tsx`.
- Code-splitting: `React.lazy` cho `RichTextEditor` (TipTap) và các bảng quản trị nặng.
- Bảo mật: hàm kiểm tra dữ liệu người dùng trong `auth-store.tsx` (lọc vai trò hợp lệ, bỏ bản ghi hỏng), bộ đếm đăng nhập sai trong `admin.login.tsx`, cờ mật khẩu mặc định.

## Kiểm tra sau khi làm

- So sánh dung lượng tải trang chủ trước/sau bằng trình duyệt tự động.
- Xác nhận các trang công khai và khu quản trị vẫn chạy đúng, đăng nhập/đăng xuất bình thường, không lỗi.
