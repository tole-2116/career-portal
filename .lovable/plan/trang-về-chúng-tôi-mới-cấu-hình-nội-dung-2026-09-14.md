# Trang "Về chúng tôi" mới + cấu hình nội dung

Làm lại trang Về chúng tôi cho đẹp và có hình ảnh thật, đồng thời cho phép quản trị viên tự sửa toàn bộ nội dung trong phần Cấu hình.

## Trang Về chúng tôi (công khai)

Bố cục mới, cuộn từ trên xuống:

1. **Ảnh bìa lớn** — ảnh văn phòng phủ kín, tiêu đề + mô tả ngắn đặt trên ảnh, kèm 3-4 con số nổi bật (năm thành lập, số nhân sự, số văn phòng, số khách hàng).
2. **Câu chuyện** — 2 đoạn văn bên trái, một ảnh đội ngũ bên phải.
3. **Cột mốc** — dòng thời gian ngang (năm + mô tả ngắn), tự xuống hàng trên điện thoại.
4. **Giá trị cốt lõi** — 3-4 thẻ có biểu tượng.
5. **Đội ngũ lãnh đạo** — thẻ có ảnh chân dung (chưa có ảnh thì hiện chữ viết tắt như hiện tại).
6. **Thư viện ảnh môi trường làm việc** — lưới 4-6 ảnh.
7. **Khối liên hệ** — giữ như hiện tại: danh sách văn phòng, email, điện thoại, nút sang trang Liên hệ.

Mọi phần đều có thể bật/tắt; phần nào tắt thì biến mất hoàn toàn.

## Ảnh

Tạo mới 6 ảnh cho trang này (ảnh bìa, ảnh câu chuyện, 4 ảnh thư viện) theo đúng tông màu thương hiệu, thêm vào thư viện ảnh dùng chung để quản trị viên chọn lại được. Ảnh lãnh đạo có thể tải lên từ máy (tối đa 1MB mỗi ảnh).

## Phần Cấu hình

Thêm tab **"Về chúng tôi"** trong Cấu hình giao diện, cho phép:

- Sửa tiêu đề, mô tả, chọn ảnh bìa; thêm/sửa/xóa số liệu nổi bật.
- Sửa 2 đoạn câu chuyện và ảnh đi kèm.
- Thêm/sửa/xóa/sắp xếp cột mốc, giá trị cốt lõi, thành viên lãnh đạo (tên, chức danh, ảnh), ảnh thư viện.
- Công tắc bật/tắt cho từng phần.
- Mọi ô chữ đều theo tab ngôn ngữ (VI/EN/…) như các màn hình nhập liệu khác.
- Nút "Lưu thay đổi" áp dụng ngay, nút khôi phục mặc định cho riêng trang này.

## Chi tiết kỹ thuật

- `src/lib/site-config.tsx`: thêm `about: AboutConfig` vào `SiteConfig` (hero {enabled,title,subtitle,image,stats[]}, story, timeline, values, leaders, gallery, contact — mỗi khối có `enabled`), `defaultAbout`, và nhánh hợp nhất trong `mergeConfig` để bản lưu cũ không thiếu trường.
- `src/data/media.ts`: thêm `aboutLibrary` (ảnh bìa + ảnh câu chuyện + ảnh thư viện) và khai báo trong `defaultMedia`.
- `src/routes/about.tsx`: viết lại theo `config.about`, bỏ dữ liệu cứng `story`/`leaders`/`lifeItems`, giữ `head()` meta và cập nhật theo tên thương hiệu.
- `src/routes/admin.settings.tsx`: thêm `TabsTrigger`/`TabsContent` value `about`, dùng `LocalizedField` + trình chọn ảnh sẵn có, sửa trên `draft` rồi `saveDraft`.
- Chạy kiểm tra kiểu và mở thử trang bằng trình duyệt tự động sau khi làm xong.
