# Phân quyền Admin / Mod cho trang quản trị

Thêm hệ thống tài khoản mô phỏng (lưu trên trình duyệt, không cần máy chủ) với hai nhóm quyền: Admin toàn quyền, Mod chỉ làm nội dung.

## 1. Tài khoản và đăng nhập

- Màn hình đăng nhập riêng cho khu vực quản trị: nhập tên đăng nhập + mật khẩu.
- Chưa đăng nhập mà mở bất kỳ trang quản trị nào thì chuyển về màn hình đăng nhập.
- Có nút Đăng xuất và hiển thị tên người đang đăng nhập ở góc trên khu quản trị.
- Tài khoản mặc định ban đầu: `admin` / `admin123` (nhắc người dùng đổi mật khẩu ngay sau khi đăng nhập).
- Ghi chú: đây là bản mô phỏng theo yêu cầu — tài khoản lưu trên trình duyệt, phù hợp trình diễn, chưa bảo mật thật. Khi cần thật, có thể nâng cấp sang tài khoản máy chủ sau.

## 2. Trang "Người dùng" (chỉ Admin)

Mục mới trong menu quản trị:

- Bảng danh sách: Tên đăng nhập, Họ tên, Nhóm quyền, Trạng thái (Hoạt động/Khoá), Ngày tạo, Hành động.
- Nút "Thêm người dùng": tên đăng nhập, họ tên, mật khẩu, chọn nhóm quyền Admin/Mod.
- Sửa: đổi họ tên, nhóm quyền, đặt lại mật khẩu, khoá/mở khoá.
- Xoá: hộp thoại xác nhận. Không cho xoá hoặc tự hạ quyền tài khoản Admin cuối cùng.

## 3. Phạm vi quyền

| Khu vực | Admin | Mod |
|---|---|---|
| Tổng quan | Có | Có |
| Tin tuyển dụng | Có | Có |
| Tin tức | Có | Có |
| Danh mục | Có | Có |
| Ứng viên & Hồ sơ tự do | Có | Không |
| Tin nhắn liên hệ | Có | Không |
| Biểu mẫu ứng tuyển | Có | Không |
| Cấu hình giao diện / công ty / ngôn ngữ / mô-đun | Có | Không |
| Người dùng | Có | Không |

Với Mod: các mục không được phép sẽ ẩn khỏi menu, và nếu gõ thẳng đường dẫn sẽ hiện thông báo "Bạn không có quyền truy cập" kèm nút quay lại Tổng quan.

## 4. Hoàn tất phần tin tức đang làm dở

- Sửa lỗi nhỏ ở trình soạn thảo bài viết (chọn ngôn ngữ nội dung).
- Trang chi tiết tin tức hiển thị nội dung định dạng phong phú (đã làm sạch an toàn) và tên tác giả.

## Chi tiết kỹ thuật

- `src/lib/auth-store.tsx`: kiểu `AdminUser { id, username, name, role: "admin" | "mod", passwordHash, active, createdAt }`, lưu localStorage `talenthub-users` + phiên đăng nhập `talenthub-session`; mật khẩu băm bằng SHA-256 qua Web Crypto (không lưu dạng chữ thường); API `login`, `logout`, `currentUser`, `addUser`, `updateUser`, `removeUser`, `can(section)`.
- `src/lib/permissions.ts`: bản đồ `role -> sections` dùng chung cho menu và chốt chặn route.
- `src/routes/admin.login.tsx`: form đăng nhập (zod + sonner), điều hướng về `/admin`.
- `src/components/admin/AdminLayout.tsx`: bọc kiểm tra phiên + quyền theo `section` truyền vào, lọc danh sách menu, thêm khối người dùng/đăng xuất.
- `src/routes/admin.users.tsx`: bảng + dialog thêm/sửa + `AlertDialog` xác nhận xoá.
- `AuthProvider` gắn trong `src/routes/__root.tsx` cùng các provider hiện có.
- Sửa `LanguageTabs` trong `admin.news.tsx` dùng đúng props `active`/`onChange`/`languages`; `news.$slug.tsx` render HTML qua DOMPurify và hiện `article.author`.
