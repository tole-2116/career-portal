# Khôi phục nội dung mặc định cho từng khối

## Mục tiêu

Trong Cấu hình giao diện, mỗi khối (widget) ở tab **Nội dung** (trang chủ) và tab **Về chúng tôi** có thêm nút **Khôi phục mặc định** riêng. Khi bấm, hệ thống hỏi xác nhận trước khi ghi đè nội dung đang tùy chỉnh.

## Người dùng sẽ thấy

- Trên đầu mỗi khối, cạnh công tắc bật/tắt, có thêm một nút biểu tượng mũi tên quay vòng, chú thích "Khôi phục mặc định".
- Bấm nút sẽ mở hộp thoại xác nhận:
  - Tiêu đề: "Khôi phục nội dung mặc định?"
  - Nội dung: "Toàn bộ chữ, mục con và kiểu hiển thị của khối «tên khối» sẽ trở về bản gốc. Nội dung bạn đã tùy chỉnh trong khối này sẽ mất."
  - Hai nút: "Hủy" và "Khôi phục".
- Sau khi xác nhận, chỉ khối đó trở về bản gốc (chữ VI/EN, danh sách mục con, ảnh, bố cục · màu nền · khoảng cách, trạng thái bật/tắt). Các khối khác và thứ tự sắp xếp giữ nguyên.
- Thông báo ngắn "Đã khôi phục khối «tên khối»." Thay đổi chỉ lưu hẳn khi bấm **Lưu thay đổi** như hiện tại, nên có thể đổi ý bằng cách rời trang mà chưa lưu.
- Hai nút khôi phục toàn bộ hiện có ("Khôi phục mặc định" của tab Về chúng tôi và "Khôi phục bố cục mặc định" của tab Nội dung) được giữ nguyên, nhưng cũng sẽ hỏi xác nhận trước khi ghi đè.

## Phạm vi khối

- Trang chủ: Mở đầu, Số liệu, Văn hóa, Phúc lợi, Việc làm nổi bật, Kêu gọi ứng tuyển.
- Về chúng tôi: Ảnh bìa, Câu chuyện, Cột mốc, Giá trị cốt lõi, Đội ngũ dẫn dắt, Thư viện ảnh, Khối liên hệ.

## Chi tiết kỹ thuật

- `src/routes/admin.settings.tsx`
  - `ContentBlock` nhận thêm prop `onReset?: () => void` và `resetLabel?: string`; khi có `onReset`, hiển thị nút `RotateCcw` (ghost, icon) trong hàng tiêu đề, bọc bởi `AlertDialog` (đã dùng trong dự án) với nội dung xác nhận nêu trên.
  - `AboutPanel`: thêm `resetAboutWidget(key)` — lấy `structuredClone(defaultAbout)`, ghi đè `about[key]` và `about.styles[key]`, giữ nguyên `about.order` và các khối khác; truyền qua `widgetProps(key)`.
  - Tab Nội dung: thêm `resetHomeWidget(key)` dựa trên `defaultSections` (và `defaultSiteConfig.copy` cho khối Mở đầu: `brand`, `eyebrow`, `title`, `subtitle`, `ctaLabel`), ghi đè `sections[key]` + `sections.styles[key]`, giữ `sections.order`; truyền qua `homeWidgetProps(key)`.
  - Hai nút khôi phục toàn tab hiện tại được bọc thêm `AlertDialog` xác nhận.
  - Nhãn khối lấy từ `t("settings.block.*")`/tiêu đề đang truyền vào `ContentBlock` để hiện trong hộp thoại và toast.
- Không đổi `src/lib/site-config.tsx` và các file hiển thị công khai; mặc định vẫn đọc từ `defaultSections`, `defaultAbout`, `defaultSiteConfig.copy`.
- Kiểm tra: typecheck và thử trên trình duyệt — sửa chữ một khối, bấm khôi phục, xác nhận nội dung trở lại bản gốc trong khi khối khác không đổi.
