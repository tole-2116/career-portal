# Rà soát và tinh chỉnh logo, hình ảnh trang chủ

Kết quả kiểm tra hiện tại: logo và toàn bộ ảnh trang chủ đều tải thành công, không có ảnh hỏng, không có lỗi trình duyệt hoặc tràn ngang trên máy tính và điện thoại. Bố cục mặc định đang dùng đủ 5 ảnh trong băng ảnh, tự chuyển sau 3 giây.

## Điều chỉnh đề xuất

- Tăng nhẹ kích thước logo và vùng nhận diện ở đầu trang để logo rõ hơn, đồng thời giữ tên và khẩu hiệu gọn trên màn hình nhỏ.
- Chuẩn hóa khung logo với nền trong suốt, `object-contain` và kích thước cố định để logo tải lên không bị méo hoặc cắt.
- Đồng bộ kích thước khai báo của băng ảnh với tỷ lệ ảnh thực tế 1600×906, tránh trình duyệt tính sai tỷ lệ trước khi ảnh tải xong.
- Giữ ảnh đầu tiên tải ưu tiên; các ảnh sau tải trì hoãn, tự chuyển 3 giây và dừng khi rê chuột như hiện tại.
- Bổ sung mô tả ảnh phù hợp cho ảnh đang hiển thị thay vì để trống hoàn toàn, nhưng không đọc các ảnh ẩn cho trình đọc màn hình.
- Kiểm tra lại cả 5 kiểu trang chủ ở kích thước máy tính và điện thoại: logo, ảnh chính, chuyển ảnh, không méo/cắt bất thường, không tràn màn hình.

## Phạm vi

Chỉ chỉnh phần hiển thị logo và ảnh trang chủ; không thay đổi nội dung chữ, dữ liệu việc làm, bảng màu hoặc cấu hình quản trị.
