# Nút chuyển ngôn ngữ dạng thả xuống & nút "Ứng tuyển" trên đầu trang

## 1. Chuyển ngôn ngữ thành danh sách thả xuống

Hiện các ngôn ngữ nằm cạnh nhau dạng nút (VI | EN | KO...), càng bật nhiều ngôn ngữ càng chiếm chỗ.

- Đổi thành một nút nhỏ hiển thị ngôn ngữ đang chọn (ví dụ "VI") kèm mũi tên.
- Bấm vào mở danh sách các ngôn ngữ đang bật, hiện tên đầy đủ (Tiếng Việt, English, 한국어...), ngôn ngữ đang chọn có dấu tick.
- Áp dụng cho cả đầu trang cổng thông tin và đầu trang quản trị (dùng chung một thành phần).

## 2. Nút đầu trang: "Bảng điều khiển" → "Ứng tuyển"

- Nút chính bên phải đầu trang đổi nhãn thành "Ứng tuyển" / "Apply", dẫn tới trang nộp hồ sơ tự do `/apply`.
- Trong menu thu gọn trên điện thoại cũng thay mục dẫn vào trang quản trị bằng mục "Ứng tuyển".
- Lối vào trang quản trị vẫn còn ở chân trang (và truy cập trực tiếp `/admin`), nên nhân sự vẫn đăng nhập được bình thường.

## Chi tiết kỹ thuật

- Viết lại `src/components/LanguageToggle.tsx` dùng `DropdownMenu` của shadcn, giữ nguyên `useI18n()` + `useLanguageConfig()`; không đổi API nên `SiteHeader` và `AdminLayout` không cần sửa import.
- `src/components/site/SiteHeader.tsx`: nút `Link to="/admin"` → `Link to="/apply"`, nhãn dùng khoá i18n mới `nav.apply` ("Ứng tuyển"/"Apply") thêm vào `src/lib/i18n.tsx`; mục `/admin` trong menu mobile thay bằng `/apply`.
- Kiểm tra `src/components/site/SiteFooter.tsx` còn liên kết `/admin`; nếu chưa có thì thêm một liên kết nhỏ "Quản trị".
