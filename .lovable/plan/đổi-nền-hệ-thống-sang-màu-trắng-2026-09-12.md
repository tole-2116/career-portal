# Đổi nền hệ thống sang màu trắng

Hiện nền đang là màu kem nhạt. Sẽ đổi sang trắng tinh cho toàn bộ trang (cổng việc làm và khu quản trị), giữ nguyên mọi màu nhấn navy/hổ phách và toàn bộ chức năng.

## Những gì thay đổi

- Nền chính của mọi trang: trắng.
- Các vùng nền phụ (khu vực xen kẽ giữa các phần, nền khu quản trị): xám rất nhạt để vẫn phân tách được với thẻ nội dung trắng.
- Thẻ, hộp nội dung: trắng, viền nhạt hơn một chút để không bị chìm trên nền trắng.
- Chế độ tối giữ nguyên như hiện tại.

## Chi tiết kỹ thuật

- `src/styles.css`, khối `:root`: đặt `--background: oklch(1 0 0)`, `--card`/`--popover` giữ trắng, chỉnh `--surface` và `--muted` sang xám trung tính rất nhạt (bỏ sắc kem, hue 85), tinh chỉnh `--border`/`--input` cho tương phản hợp lý.
- Không đổi `.dark`, không đổi token màu nhấn, không đổi component hay logic.
