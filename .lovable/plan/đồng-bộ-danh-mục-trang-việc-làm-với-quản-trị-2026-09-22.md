# Đồng bộ danh mục trang Việc làm với quản trị

## Kết quả

- Năm bộ lọc trên `/jobs` dùng trực tiếp năm nhóm mặc định trong Admin → Danh mục: Ngành nghề, Hình thức làm việc, Mức lương, Kinh nghiệm và Nơi làm việc.
- Hiển thị toàn bộ mục đã cấu hình theo đúng thứ tự quản trị, kể cả mục chưa có tin tuyển dụng; chọn mục chưa có tin sẽ hiển thị trạng thái không có kết quả.
- Tin tuyển dụng liên kết với mục danh mục bằng mã ổn định thay vì so khớp nội dung tiếng Anh, nên sửa tên Việt/Anh trong danh mục sẽ cập nhật ngay trên bộ lọc, thẻ tin và trang chi tiết.
- Khi xóa một mục danh mục, liên kết đó được gỡ khỏi các tin đang dùng. Tin liên quan sẽ để trống trường tương ứng và quản trị viên cần chọn lại; với Nơi làm việc, chỉ địa điểm bị xóa được gỡ khỏi danh sách.
- Màn hình Tạo/Sửa tin tiếp tục chọn dữ liệu từ cùng nguồn danh mục và lưu đúng liên kết.

## Tương thích dữ liệu hiện có

- Khi tải dữ liệu cũ, hệ thống tự đối chiếu nội dung Việt/Anh để gắn mã danh mục cho các giá trị trùng khớp.
- Giá trị cũ không còn tồn tại trong danh mục sẽ được xem là chưa chọn, đúng với nguyên tắc đồng bộ hoàn toàn.
- Các nhóm danh mục tự tạo vẫn được quản lý trong Admin nhưng không tự xuất hiện thành bộ lọc `/jobs`, vì tin tuyển dụng hiện chỉ có năm trường danh mục chuẩn.

## Chi tiết kỹ thuật

- Bổ sung mã tham chiếu danh mục cho năm trường trong dữ liệu tin tuyển dụng, gồm danh sách mã cho nhiều Nơi làm việc.
- Chuẩn hóa và nâng cấp dữ liệu cũ trong kho tin; đồng bộ nội dung hiển thị từ mã tham chiếu mỗi khi danh mục thay đổi.
- Cập nhật các trường chọn trong quản trị để đọc/ghi mã mục danh mục; bỏ luồng nhập giá trị ngoài danh mục đối với năm trường chuẩn.
- Viết lại bộ lọc `/jobs` dùng ID làm giá trị lọc và dùng toàn bộ danh sách từ cấu hình, không trộn thêm giá trị ngoài danh mục từ tin cũ.
- Kiểm tra các tình huống thêm, đổi tên, đổi thứ tự và xóa mục; xác nhận kết quả trên `/jobs`, trang chi tiết và màn hình sửa tin ở cả Việt/Anh.
