# Task-01: Authentication Flow

## Status: in-progress

## Mô tả
Xây dựng luồng xác thực hoàn chỉnh cho cả ứng viên và quản trị viên, bao gồm đăng ký, đăng nhập, quên mật khẩu và phân quyền truy cập.

## Phạm vi
- Đăng ký tài khoản ứng viên
- Đăng nhập / đăng xuất
- Phân quyền Admin vs User (dựa trên auth-store hiện có)
- Bảo vệ routes admin
- Form validation với Zod + React Hook Form

## Yêu cầu kỹ thuật
- Sử dụng `auth-store.ts` hiện có trong `src/lib/`
- Tạo/update route auth: `src/routes/admin.login.tsx`
- Guards cho admin routes
- Toast notification cho feedback

## Acceptance Criteria
- [ ] Đăng ký tài khoản mới thành công
- [ ] Đăng nhập với email/password
- [ ] Redirect đúng vai trò (admin → dashboard, user → homepage)
- [ ] Route admin yêu cầu xác thực
- [ ] Đăng xuất xóa session

## Ưu tiên: High
## Ước tính: 2-3 ngày
