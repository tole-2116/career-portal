# Nâng cấp tin tuyển dụng + thiết lập trong Admin

Mục tiêu: trang danh sách việc làm trông giống ảnh tham chiếu (bộ lọc cột trái, thẻ tin có nhãn "Nổi bật", mức lương, nút "Xem chi tiết"), tin tuyển dụng có thêm trường mới, và HR quản lý được tất cả trong Admin. Dữ liệu lưu tạm trên trình duyệt.

## 1. Trang danh sách việc làm (/jobs)

- Bố cục 2 cột: cột lọc bên trái (thẻ "Bộ lọc"), danh sách tin bên phải dạng lưới 2 cột; trên điện thoại bộ lọc xếp phía trên.
- Bộ lọc: Từ khóa, Ngành nghề, Địa điểm, Loại hình, **Cấp bậc** (mới), **Trạng thái** (mới: Đang mở / Tạm dừng / Tất cả).
- Dòng "Tìm thấy N vị trí" phía trên danh sách.
- Thẻ tin: nhãn ngành nghề + nhãn "Nổi bật" (nếu bật), tiêu đề, mô tả ngắn, dòng địa điểm · loại hình · hạn nộp, và chân thẻ có mức lương bên trái, "Xem chi tiết →" bên phải.
- Tin "Nổi bật" luôn xếp lên đầu danh sách.

## 2. Trường mới cho tin tuyển dụng

Thêm vào mỗi tin (hiển thị ở thẻ tin và trang chi tiết khi có nội dung):

- Nổi bật (bật/tắt)
- Số lượng cần tuyển
- Kinh nghiệm yêu cầu
- Ngôn ngữ yêu cầu
- Người phụ trách / email liên hệ tuyển dụng

## 3. Admin — Quản lý tin (/admin/jobs)

- Tạo / sửa / xóa tin thật, có lưu lại (trình duyệt), thay cho hộp thoại chỉ demo hiện nay.
- Biểu mẫu song ngữ Việt–Anh cho: tiêu đề, ngành nghề, địa điểm, loại hình, cấp bậc, mức lương, mô tả ngắn; cùng hạn nộp, trạng thái, công tắc Nổi bật và các trường mới ở mục 2.
- Soạn nội dung chi tiết: các đoạn mô tả, yêu cầu, quyền lợi (thêm / xóa / sắp xếp từng dòng).
- Nút khôi phục danh sách tin mẫu ban đầu.
- Bảng danh sách có thêm cột Nổi bật và nút xóa.

## 4. Admin — Thiết lập hiển thị danh sách (/admin/settings)

Thẻ mới "Trang việc làm":

- Chọn bố cục danh sách: bộ lọc cột trái (như ảnh) hoặc thanh lọc ngang (hiện tại).
- Bật/tắt từng bộ lọc: ngành nghề, địa điểm, loại hình, cấp bậc, trạng thái.
- Bật/tắt hiển thị mức lương, hạn nộp, nhãn Nổi bật trên thẻ tin.
- Số tin mỗi trang + nút "Xem thêm".
- Tiêu đề và mô tả trang việc làm (song ngữ).

## Chi tiết kỹ thuật

- `src/data/jobs.ts`: mở rộng type `Job` với `featured` (đã có), `headcount`, `experience`, `languages`, `contactEmail`, `contactName`; giữ dữ liệu mẫu làm mặc định.
- Thêm `src/lib/jobs-store.tsx`: provider + `useJobs()` lưu danh sách tin vào localStorage khóa `talenthub-jobs`, có `saveJob`, `deleteJob`, `resetJobs`, merge với dữ liệu mẫu để tương thích ngược. Đăng ký provider trong `src/routes/__root.tsx`.
- `src/lib/site-config.tsx`: thêm nhánh `jobsPage` (layout, filters bật/tắt, hiển thị card, pageSize, copy song ngữ) vào `SiteConfig`, defaults và `mergeConfig`.
- Cập nhật `src/routes/jobs.index.tsx` (bố cục + lọc + phân trang), `src/components/site/JobCard.tsx` (nhãn Nổi bật, chân thẻ lương + Xem chi tiết), `src/routes/jobs.$jobId.index.tsx` (các trường mới), `src/routes/admin.jobs.tsx` (CRUD thật), `src/routes/admin.settings.tsx` (thẻ mới), `src/lib/i18n.tsx` (khóa dịch mới).
- Trang chủ đọc tin từ store thay vì mảng tĩnh để danh sách đồng bộ.
- Kiểm tra bằng typecheck và chạy thử trình duyệt trên /jobs, /admin/jobs, /admin/settings.

## Giới hạn

Dữ liệu tin tuyển dụng chỉ lưu trên trình duyệt của máy đang dùng. Muốn mọi khách truy cập thấy cùng nội dung và có đăng nhập HR thì cần bật cơ sở dữ liệu sau này.
