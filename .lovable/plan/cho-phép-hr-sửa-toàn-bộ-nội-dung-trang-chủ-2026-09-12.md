# Cho phép HR sửa toàn bộ nội dung trang chủ

Hiện tại trong mục **Cấu hình giao diện**, HR chỉ sửa được: bố cục, màu, ảnh, tên thương hiệu, dòng nhỏ phía trên, tiêu đề chính, mô tả ngắn và chữ trên nút. Các phần còn lại của trang chủ (số liệu, văn hóa, phúc lợi, khối kêu gọi ứng tuyển, tiêu đề từng khu vực) đang cố định trong mã nguồn.

Kế hoạch mở rộng phần cấu hình để HR sửa được **mọi nội dung chữ của trang chủ**, vẫn song ngữ Việt – Anh, áp dụng cho cả 5 bố cục.

## Những gì HR sẽ sửa được thêm

1. **Dải số liệu** — 4 ô: sửa con số và nhãn; thêm/xóa/sắp xếp ô; có tùy chọn "tự đếm số vị trí đang tuyển" cho ô đầu.
2. **Khu vực Văn hóa** — dòng nhỏ, tiêu đề, mô tả; danh sách giá trị văn hóa: thêm/xóa/sắp xếp, sửa tiêu đề, nội dung và chọn biểu tượng.
3. **Khu vực Phúc lợi** — dòng nhỏ, tiêu đề, mô tả; danh sách phúc lợi: thêm/xóa/sắp xếp, sửa tiêu đề, nội dung, chọn biểu tượng.
4. **Khu vực Việc làm nổi bật** — dòng nhỏ, tiêu đề, chữ liên kết "Xem tất cả vị trí", số lượng vị trí hiển thị (2–6).
5. **Khối kêu gọi cuối trang** — tiêu đề, mô tả, chữ nút.
6. **Ẩn/hiện từng khu vực** bằng công tắc, để mỗi bố cục gọn theo ý HR.

## Giao diện trang cấu hình

Trang `/admin/settings` hiện đang dài; chia thành các thẻ (tab) để dễ dùng:

```text
[ Bố cục ] [ Màu sắc ] [ Hình ảnh ] [ Nội dung chữ ]
```

Thẻ **Nội dung chữ** gồm các khối gập/mở: Phần mở đầu, Số liệu, Văn hóa, Phúc lợi, Việc làm, Kêu gọi ứng tuyển. Mỗi mục nhập có 2 ô: tiếng Việt và tiếng Anh. Giữ nguyên các nút **Xem trang chủ**, **Lưu**, **Khôi phục mặc định**.

## Chi tiết kỹ thuật

- Mở rộng `SiteConfig` trong `src/lib/site-config.tsx`: thêm `sections` với `stats`, `culture`, `benefits`, `jobs`, `cta` — mỗi khu vực có `enabled`, phần tiêu đề song ngữ và mảng mục con (`id`, `icon`, `title`, `body`). Giữ `copy` hiện có cho phần mở đầu.
- Giá trị mặc định lấy từ `src/data/homeContent.ts` và các khóa `home.*` trong `src/lib/i18n.tsx`, chuyển thành dữ liệu mặc định của config (giữ file i18n cho nhãn giao diện chung).
- Danh sách biểu tượng: bảng tên → `LucideIcon` (khoảng 12 lựa chọn) trong `src/data/homeContent.ts`, vì không lưu được hàm vào `localStorage`.
- Hợp nhất config cũ trong `localStorage` với mặc định theo từng khu vực để cấu hình đã lưu không bị lỗi thiếu trường.
- Cập nhật `src/components/home/shared.tsx` (`useHomeData` trả về sections đã cấu hình, số liệu tự đếm, số job hiển thị) và cả 5 component trong `src/components/home/` để đọc từ config thay vì hằng số, đồng thời tôn trọng công tắc ẩn/hiện.
- `src/routes/admin.settings.tsx`: thêm Tabs và trình soạn danh sách (thêm/xóa/di chuyển lên–xuống) dùng component shadcn sẵn có.

## Ngoài phạm vi

Cấu hình vẫn lưu trên trình duyệt của người đang dùng, chưa đồng bộ cho mọi khách truy cập. Khi cần lưu thật, bật Lovable Cloud và chuyển sang lưu trong cơ sở dữ liệu.
