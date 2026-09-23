# Rà soát & nâng cấp màu thương hiệu cho Trang chủ và Việc làm

## Hiện trạng (đã kiểm tra trong mã nguồn)

- Cấu hình thương hiệu chỉ đặt 2 màu: màu chính và màu nhấn. Khi lưu, hệ thống chỉ ghi đè 10 biến màu (nút chính, viền focus, biểu đồ, thanh bên quản trị).
- Những phần còn lại vẫn dùng màu navy cố định của bộ giao diện gốc: nền phụ, dải màu lớn ở đầu trang chủ, chữ tiêu đề, viền, nhãn.
  Hệ quả: đổi sang tông xanh ngọc hay cam, trang chủ vẫn phảng phất navy — cảm giác "không ăn nhập".
- Bố cục "Nền tối nổi bật" dùng mã màu cứng `#0e1116` và chữ trắng cố định, hoàn toàn không đổi theo thương hiệu.
- Chữ trên nền tối ở một vài khối dùng trắng cố định nên với màu chính sáng (ví dụ Cát ấm) sẽ khó đọc.
- Chế độ tối không nhận màu thương hiệu đã chỉnh (chỉ áp một bộ giá trị chung).

## Phương án đề xuất (tốt hơn hiện tại)

Thay vì chỉ gán 2 màu, sinh ra **một bộ màu đầy đủ** từ màu chính + màu nhấn:

1. Tự động tạo các sắc độ phái sinh: tông chính đậm/nhạt, nền phụ pha nhẹ màu thương hiệu, viền, nhãn, chữ phụ, dải màu đầu trang chủ.
2. Tự kiểm tra độ tương phản: nếu chữ trên nền không đủ rõ, hệ thống tự chọn chữ sáng hoặc tối phù hợp thay vì luôn dùng trắng.
3. Đồng bộ cả chế độ sáng và tối từ cùng một cặp màu.
4. Gỡ toàn bộ mã màu cứng ở bố cục "Nền tối nổi bật" và các khối chữ trắng, chuyển sang màu hệ thống.
5. Trang Việc làm (danh sách, thẻ tin, bộ lọc, chi tiết tin) dùng đúng bộ màu này: nhãn ngành nghề, badge "Nổi bật", nút xem chi tiết, trạng thái đang tuyển/đã đóng.

Ngoài ra bổ sung trong trang quản trị:

- Thêm tùy chọn **cường độ màu nền** (Trắng tinh / Pha nhẹ màu thương hiệu / Đậm) để trang chủ không bị đơn điệu mà vẫn giữ nền sáng.
- Cảnh báo ngay khi cặp màu chọn không đủ tương phản, kèm gợi ý màu thay thế.
- Xem trước trực tiếp cả Trang chủ và Trang việc làm ngay trong phần cài đặt.
- Bổ sung 3 bộ màu dựng sẵn dành cho tuyển dụng doanh nghiệp: Xanh tin cậy, Tím công nghệ, Đỏ đô sang trọng.

## Chi tiết kỹ thuật

- `src/lib/site-config.tsx`: viết lại `applyPalette` thành bộ sinh token hoàn chỉnh (chuyển hex sang OKLCH, sinh biến thể theo độ sáng/chroma), thêm `surfaceTone` vào `SiteConfig` + `mergeConfig`, thêm hàm kiểm tra tương phản WCAG, ghi cả token cho `.dark`.
- Các token được ghi thêm: `--background`, `--surface`, `--secondary`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--foreground`, `--card-foreground`, `--gradient-hero`, `--elevation-*`.
- `src/components/home/HomeSpotlight.tsx`: thay `bg-[#0e1116]`, `text-white/*` bằng `bg-primary`, `text-primary-foreground/*`.
- `src/components/home/shared.tsx`: thay `text-white` tone dark bằng token foreground.
- `src/components/site/JobCard.tsx`, `src/routes/jobs.index.tsx`, `src/routes/jobs.$jobId.index.tsx`: rà soát và chuyển các chỗ còn dùng màu cố định sang token.
- `src/routes/admin.settings.tsx`: thêm chọn cường độ nền, cảnh báo tương phản, 3 preset mới, khối xem trước hai trang.
- Kiểm thử: typecheck + Playwright chụp `/`, `/jobs`, `/jobs/:id`, `/admin/settings` với ít nhất 3 bộ màu khác nhau để xác nhận đồng bộ và không lỗi console.

Không thay đổi dữ liệu, danh mục, biểu mẫu hay logic nghiệp vụ. Cấu hình vẫn lưu trên trình duyệt như hiện nay.
