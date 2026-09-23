# Danh mục dạng tab

Màn hình Danh mục hiện xếp 5 nhóm (Ngành nghề, Hình thức, Mức lương, Kinh nghiệm, Nơi làm việc) thành các khối cạnh nhau, phải cuộn nhiều. Chuyển sang dạng tab để mỗi lần chỉ xem một nhóm.

## Thay đổi

- Hàng tab ở đầu trang: Ngành nghề · Hình thức · Mức lương · Kinh nghiệm · Nơi làm việc, mặc định mở Ngành nghề.
- Mỗi tab hiện số mục đang có trong nhóm đó (ví dụ "Mức lương 5").
- Nội dung bên trong giữ nguyên: thêm mục, sửa tên theo tab ngôn ngữ, di chuyển lên/xuống, xóa, số tin đang dùng.
- Nút "Khôi phục mặc định" vẫn ở góc trên, áp dụng cho toàn bộ danh mục như hiện nay.
- Trên màn hình hẹp, hàng tab tự xuống dòng để không bị tràn.

## Kỹ thuật

- Sửa duy nhất `src/routes/admin.taxonomies.tsx`: bọc phần `groups.map` bằng `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` từ `@/components/ui/tabs`, `defaultValue="departments"`, `TabsList` dùng `flex-wrap`.
- Nội dung mỗi `TabsContent` là khối `section` hiện có, bỏ lưới `xl:grid-cols-2`.
- Không đổi `taxonomy-store`, dữ liệu hay logic đếm usage.
