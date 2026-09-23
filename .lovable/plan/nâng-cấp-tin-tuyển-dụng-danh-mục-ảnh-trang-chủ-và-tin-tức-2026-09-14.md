# Nâng cấp Tin tuyển dụng, Danh mục, Ảnh trang chủ và Tin tức

## 1. Tin tuyển dụng: thêm trạng thái Nháp và Hết hạn

- Bổ sung hai trạng thái mới bên cạnh Đang tuyển / Tạm dừng / Đã đóng:
  - **Nháp** — nhãn xám, chỉ thấy trong trang quản trị.
  - **Hết hạn** — nhãn đỏ cam.
- Màn hình tạo/sửa tin có thêm nút **Lưu nháp** (lưu và đặt trạng thái Nháp) bên cạnh nút Lưu hiện tại.
- Bộ lọc trạng thái trong danh sách quản trị có thêm hai mục này.
- **Tự động hết hạn**: mỗi lần mở hệ thống (và khi danh sách tin được đọc), tin đang ở trạng thái Đang tuyển mà đã qua ngày kết thúc sẽ tự chuyển sang Hết hạn và được lưu lại.
- Ngoài trang công khai: tin Nháp và Hết hạn bị **ẩn hoàn toàn** — không hiện trong danh sách việc làm, không hiện ở trang chủ; mở thẳng đường dẫn sẽ báo vị trí không còn nhận hồ sơ và mời gửi hồ sơ tự do.

## 2. Danh mục: đặt lại tên nhóm và cho phép thêm nhóm mới

- Đổi tên hiển thị 5 nhóm mặc định thành: **Ngành nghề · Hình thức làm việc · Mức lương · Kinh nghiệm · Nơi làm việc** (dữ liệu cũ giữ nguyên, chỉ đổi nhãn).
- Thêm nút **Thêm nhóm danh mục mới** ở đầu trang Danh mục: nhập tên nhóm (Việt/Anh), hệ thống tạo một tab mới ngang hàng 5 nhóm mặc định.
- Trong tab nhóm tự tạo: thêm/sửa/xóa/sắp xếp mục con giống các nhóm mặc định, kèm nút xóa cả nhóm (có hỏi xác nhận). 5 nhóm mặc định không xóa được vì đang gắn với biểu mẫu tin tuyển dụng.

## 3. Ảnh trang chủ: giới hạn 5 ảnh và lưu nhanh

- Khi chọn ảnh thứ 6 cho băng ảnh trang chủ: hiện thông báo lỗi và không thêm.
- Thêm nút **Lưu thay đổi** ngay trong khối băng ảnh để lưu riêng phần ảnh mà không cần cuộn lên nút Lưu chung; hiện số ảnh đang chọn (ví dụ 3/5).
- Băng ảnh ngoài trang chủ chuyển ảnh mỗi **3 giây** (hiện tại là 5 giây), vẫn dừng khi rê chuột và tôn trọng thiết lập giảm chuyển động của máy.

## 4. Tin tức: bảng danh sách, biểu mẫu đầy đủ, xóa có xác nhận

- **Danh sách bài viết** chuyển thành bảng: Ảnh thu nhỏ · Tiêu đề · Tác giả · Ngày tạo · Trạng thái (Nháp/Đã xuất bản) · Hành động (Sửa/Xóa). Trên màn hình nhỏ hiển thị dạng thẻ.
- **Biểu mẫu tạo/sửa** gồm: Tiêu đề, Đường dẫn (tự sinh từ tiêu đề, sửa được), Ảnh đại diện (chọn từ thư viện hoặc tải ảnh lên), Tóm tắt, Nội dung chi tiết bằng trình soạn thảo đầy đủ (in đậm, nghiêng, tiêu đề, danh sách, liên kết, trích dẫn), Chuyên mục, Ngày, Tác giả (mặc định điền tên công ty, sửa được), Nổi bật.
- Hai nút lưu: **Lưu nháp** và **Xuất bản**.
- Nút xóa mở hộp thoại xác nhận "Bạn có chắc muốn xóa bài viết này không?" trước khi xóa.
- Trang tin tức công khai hiển thị nội dung định dạng phong phú và tên tác giả; bài Nháp không hiện ra ngoài.

## Chi tiết kỹ thuật

- `src/data/jobs.ts`: `JobStatus` thêm `"draft" | "expired"`; `jobs-store.tsx` `normalize` chấp nhận giá trị mới, thêm bước `applyExpiry` (so sánh `deadline` với hôm nay) chạy khi khởi tạo và persist kết quả; export `publicJobs`/helper `isPublicJob` dùng chung cho `/jobs`, trang chủ và trang chi tiết.
- `src/routes/admin.jobs.tsx`: `statusLabels`/`statusVariant` thêm 2 khóa (draft → `secondary` xám, expired → badge destructive/cam), nút "Lưu nháp" trong dialog form.
- `src/lib/taxonomy-store.tsx`: chuyển `Taxonomies` từ `Record<TaxonomyKey, …>` sang danh sách nhóm `{ key, label, builtIn, items[] }` giữ 5 khóa mặc định, kèm `normalize` nâng cấp dữ liệu localStorage cũ; thêm `addGroup`/`renameGroup`/`removeGroup`. Cập nhật nơi đọc `taxonomies.departments|workTypes|…` (`admin.jobs.tsx`, `jobs.index.tsx`, `admin.taxonomies.tsx`) qua helper `groupItems(key)` để không vỡ kiểu.
- `src/routes/admin.settings.tsx`: khối băng ảnh kiểm tra `heroImages.length >= 5` → `toast.error`; nút lưu cục bộ gọi cùng hàm lưu cấu hình hiện có.
- `src/components/site/HeroCarousel.tsx`: `interval` mặc định `3000`.
- `src/lib/news-store.tsx`: `Article` thêm `author: string`, `body` chuyển sang HTML (nội dung mẫu cũ dạng text được bọc thành đoạn khi nâng cấp); `emptyArticle()` nhận tên công ty làm tác giả mặc định.
- Cài `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`; tạo `src/components/admin/RichTextEditor.tsx` (toolbar + `EditorContent`), dùng trong dialog bài viết theo từng ngôn ngữ; trang `news.$slug.tsx` render HTML đã làm sạch bằng `sanitize-html`/DOMPurify trước khi hiển thị.
