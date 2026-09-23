# Nâng cấp cấu hình widget trang Về chúng tôi

## Mục tiêu
Biến tab **Cấu hình giao diện → Về chúng tôi** thành trình quản lý widget dạng danh sách kéo thả. Người quản trị có thể sửa nội dung, bật/tắt, đổi thứ tự và điều chỉnh cách trình bày của từng khối.

## Phạm vi thực hiện

### 1. Mô hình cấu hình widget
- Giữ 7 widget hiện có: Ảnh bìa, Câu chuyện, Cột mốc, Giá trị cốt lõi, Đội ngũ dẫn dắt, Thư viện ảnh và Liên hệ.
- Bổ sung thứ tự widget dùng chung cho trang Về chúng tôi.
- Mỗi widget có các thuộc tính trình bày:
  - Kiểu bố cục phù hợp với nội dung của widget.
  - Màu nền: trắng, nền nhẹ hoặc màu thương hiệu.
  - Khoảng cách: gọn, tiêu chuẩn hoặc rộng.
- Tự nâng cấp cấu hình đã lưu trước đây với giá trị mặc định để không mất nội dung.

### 2. Trình quản lý dạng danh sách kéo thả
- Hiển thị mỗi widget thành một hàng có tay nắm kéo, tên, trạng thái bật/tắt và nút mở phần chỉnh sửa.
- Cho phép kéo thả để đổi thứ tự; vẫn có nút lên/xuống để hỗ trợ bàn phím và thiết bị cảm ứng.
- Thu gọn nội dung mặc định để trang cấu hình dễ quan sát; mở từng widget khi cần sửa.
- Trong mỗi widget, thêm các lựa chọn Bố cục, Màu nền và Khoảng cách bên cạnh phần nội dung hiện có.
- Giữ nút **Lưu thay đổi** và **Khôi phục mặc định**; chỉ áp dụng ra trang công khai sau khi lưu.

### 3. Các tùy chọn bố cục theo widget
- **Ảnh bìa:** nội dung giữa hoặc căn trái; số liệu dạng hàng hoặc lưới.
- **Câu chuyện:** ảnh bên trái, ảnh bên phải hoặc nội dung toàn chiều rộng.
- **Cột mốc:** lưới hoặc dòng thời gian dọc.
- **Giá trị cốt lõi:** lưới 2, 3 hoặc 4 cột.
- **Đội ngũ dẫn dắt:** lưới 2, 3 hoặc 4 cột.
- **Thư viện ảnh:** ảnh nổi bật, lưới đều hoặc dạng dải ảnh.
- **Liên hệ:** thẻ theo lưới hoặc nội dung gọn theo hàng.

### 4. Trang Về chúng tôi
- Render các widget theo đúng thứ tự quản trị đã lưu.
- Widget tắt sẽ biến mất hoàn toàn.
- Áp dụng đúng bố cục, màu nền và khoảng cách của từng widget trên máy tính và điện thoại.
- Giữ nội dung song ngữ, hình ảnh và dữ liệu liên hệ đồng bộ hiện có.

### 5. Kiểm tra
- Kiểm tra kéo thả, nút lên/xuống, bật/tắt và lưu cấu hình.
- Kiểm tra từng lựa chọn bố cục, màu nền và khoảng cách trên trang công khai.
- Kiểm tra cấu hình cũ tự nâng cấp, khôi phục mặc định và không có lỗi trên desktop/mobile.

## Chi tiết kỹ thuật
- Mở rộng `AboutConfig` bằng danh sách thứ tự và thiết lập trình bày theo từng widget.
- Dùng thư viện kéo thả tương thích React; thao tác kéo chỉ bắt đầu từ tay nắm để không ảnh hưởng các ô nhập liệu.
- Tách phần render từng widget để trang công khai có thể sắp xếp động nhưng vẫn giữ mã dễ bảo trì.
- Chỉ dùng token màu và thành phần giao diện hiện có của dự án.
