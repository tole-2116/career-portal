# Task-03: Payment Integration

## Status: backlog

## Mô tả
Tích hợp hệ thống thanh toán trực tuyến cho phép ứng viên nộp phí xét duyệt hồ sơ nâng cao (premium job listings).

## Phạm vi
- Tích hợp cổng thanh toán (VNPay, MoMo hoặc Stripe)
- Tạo trang thanh toán và xác nhận giao dịch
- Lưu lịch sử thanh toán trong store
- Xác nhận thanh toán thành công/thất bại với UI feedback

## Yêu cầu kỹ thuật
- Sử dụng existing auth store để xác thực người dùng
- Tạo route mới `src/routes/payment.tsx`
- Tạo store mới `src/lib/payment-store.ts`
- UI components dùng Shadcn UI

## Acceptance Criteria
- [ ] User có thể chọn gói thanh toán
- [ ] Redirect đến cổng thanh toán
- [ ] Xác nhận kết quả giao dịch
- [ ] Hiển thị lịch sử giao dịch trong admin

## Ưu tiên: Medium
## Ước tính: 3-5 ngày
