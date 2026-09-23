# Cấu hình trang chủ dạng widget

Chuyển tab "Nội dung" trong Cấu hình giao diện sang dạng widget kéo thả giống tab "Về chúng tôi".

## Các widget trang chủ

| Widget | Nội dung |
|---|---|
| Băng giới thiệu (Hero) | Chữ dẫn, tiêu đề, mô tả, nút hành động, băng ảnh |
| Số liệu | Danh sách chỉ số (có chỉ số tự đếm tin đang tuyển) |
| Văn hóa | Tiêu đề khối + các thẻ nội dung |
| Phúc lợi | Tiêu đề khối + các thẻ nội dung |
| Việc làm nổi bật | Tiêu đề khối, số tin hiển thị, nhãn nút xem tất cả |
| Gửi hồ sơ tự do (CTA) | Tiêu đề, mô tả, nhãn nút |

## Người dùng làm được gì

- Kéo thả để sắp xếp thứ tự các khối trên trang chủ.
- Bật/tắt từng khối; khối tắt biến mất hoàn toàn khỏi trang chủ.
- Với mỗi khối chọn: Bố cục, Màu nền (Trắng / Nền dịu / Thương hiệu), Khoảng cách (Gọn / Vừa / Rộng).
- Sửa toàn bộ chữ song ngữ VI/EN như hiện tại, ngay trong từng widget khi mở ra.
- Nút "Lưu thay đổi" và "Khôi phục mặc định".

Cấu hình widget này dùng chung cho cả 5 kiểu trang chủ (Classic, Split, Bento, Editorial, Spotlight); mỗi kiểu vẫn giữ phong cách trình bày riêng của nó.

## Chi tiết kỹ thuật

- `src/lib/site-config.tsx`: thêm `HomeWidgetKey = "hero"|"stats"|"culture"|"benefits"|"jobs"|"cta"`, dùng lại `AboutWidgetTone`/`AboutWidgetSpacing`/`AboutWidgetStyle`; `SiteSections` thêm `order: HomeWidgetKey[]` và `styles: Record<HomeWidgetKey, AboutWidgetStyle>`; thêm `hero: { enabled: boolean }` (chữ hero vẫn nằm ở `copy`). Mặc định order hero → stats → culture → benefits → jobs → cta. `mergeConfig` tự bổ sung `order`/`styles` cho cấu hình cũ (lọc key lạ, thêm key thiếu) để không vỡ dữ liệu đã lưu.
- `src/components/home/shared.tsx`: export `homeOrder`, `homeStyle(key)`, cùng helper `sectionClass(tone)` / `innerClass(spacing)` tương tự `about.tsx`, kèm fallback khi cấu hình cũ thiếu dữ liệu.
- 5 file `Home*.tsx`: tách phần render từng khối thành các hàm `renderWidget(key)`, render theo `order`, bọc mỗi khối bằng lớp tone/spacing, bỏ khối khi `enabled = false`. Giữ nguyên điều kiện `modules.openApplication` cho khối CTA.
- `src/routes/admin.settings.tsx`: tab "Nội dung" dùng `DndContext` + `SortableContext` + `ContentBlock` (đã hỗ trợ `widgetKey`/`widgetStyle`/`orderIndex`/`onWidgetStyle`), thêm bảng `widgetLayoutOptions` cho các widget trang chủ (ví dụ hero: trái/giữa; culture & benefits: 2/3/4 cột; jobs: lưới/danh sách; stats: hàng/lưới; cta: giữa/ngang).
- Kiểm tra bằng typecheck và Playwright: đổi thứ tự + tắt một khối, lưu, xác nhận trang chủ phản ánh đúng ở kiểu đang chọn.
