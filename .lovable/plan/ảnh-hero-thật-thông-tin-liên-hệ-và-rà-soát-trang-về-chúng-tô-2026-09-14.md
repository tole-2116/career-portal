# Ảnh hero thật, thông tin liên hệ và rà soát trang Về chúng tôi / chân trang

Bạn đã bỏ qua phần câu hỏi, nên kế hoạch dùng phương án mặc định hợp lý: tạo ảnh mới theo phong cách thương hiệu và chuẩn hóa lại thông tin liên hệ đang có sẵn. Thông tin liên hệ hiện tại (địa chỉ, email, điện thoại, mạng xã hội TalentHub) là nội dung mẫu do hệ thống tạo — bạn cần gửi thông tin thật để thay thế.

## Băng ảnh trang chủ

- Tạo 5 ảnh mới chất lượng cao theo tông màu thương hiệu (Navy & Hổ phách): văn phòng sáng, đội ngũ họp nhóm, không gian làm việc buổi tối, khu nghỉ ngơi, buổi chia sẻ nội bộ.
- Bổ sung 5 ảnh này vào thư viện ảnh hero để chọn trong Cấu hình giao diện, và đặt làm băng ảnh mặc định của trang chủ (tự chuyển 3 giây/ảnh).
- Ảnh cũ vẫn giữ trong thư viện để bạn đổi lại nếu muốn.

## Trang Liên hệ

- Thông tin liên hệ đã tự động lấy từ phần khai báo công ty, nên phần sửa nằm ở giá trị mặc định:
  - Gom về một bộ thông tin nhất quán: tên công ty, 3 văn phòng (TP. Hồ Chí Minh, Hà Nội, Đà Nẵng), email tuyển dụng, số điện thoại, website.
  - Xóa các liên kết mạng xã hội mẫu không có thật (để trống thì biểu tượng tự ẩn), chỉ giữ lại khi bạn cung cấp link thật.
- Thêm phần giờ làm việc và ghi chú thời gian phản hồi để trang không bị trống.

## Trang Về chúng tôi

- Rà soát và đồng bộ số liệu với phần khai báo công ty: số văn phòng lấy theo danh sách chi nhánh thay vì con số cố định.
- Khối thông tin liên hệ ở cuối trang hiển thị đầy đủ tên chi nhánh + địa chỉ + email + điện thoại, thống nhất với trang Liên hệ.
- Thay ảnh minh họa văn hóa bằng ảnh mới vừa tạo.

## Chân trang

- Kiểm tra lại 3 cột: giới thiệu ngắn, liên kết nhanh, liên hệ — đảm bảo ẩn sạch mục trống, không để khoảng trắng thừa.
- Dòng bản quyền hiển thị đúng tên công ty và năm hiện tại.

## Cần bạn cung cấp

Địa chỉ, email, số điện thoại, website, mạng xã hội và mã số thuế thật. Khi có, tôi thay ngay vào phần khai báo công ty và mọi trang sẽ tự cập nhật.

## Chi tiết kỹ thuật

- Tạo ảnh bằng công cụ sinh ảnh, lưu vào `src/assets/`, khai báo trong `src/data/media.ts` (`heroLibrary`, `cultureLibrary`).
- `src/lib/site-config.tsx`: cập nhật `defaultCompany` (locations, email, phone, website, social rỗng) và `defaultConfig.images.heroImages` trỏ tới 5 ảnh mới.
- `src/routes/about.tsx`: thay số liệu văn phòng cố định bằng `config.company.locations.length`, dùng ảnh mới.
- `src/routes/contact.tsx`: bổ sung khối giờ làm việc; không đổi logic biểu mẫu.
- `src/components/site/SiteFooter.tsx`: chỉ rà soát hiển thị, không đổi cấu trúc.
