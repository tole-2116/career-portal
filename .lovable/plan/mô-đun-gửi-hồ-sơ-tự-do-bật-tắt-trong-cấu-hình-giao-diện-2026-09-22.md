# Mô-đun "Gửi hồ sơ tự do" — bật/tắt trong Cấu hình giao diện

## Mục tiêu

Trong **Cấu hình giao diện → tab Mô-đun**, thêm công tắc **Gửi hồ sơ tự do** (ngang hàng công tắc Tin tức). Khi tắt:

- Ẩn toàn bộ khối/nút "Gửi hồ sơ tự do" trên **trang chủ** (cả 5 kiểu: Classic, Split, Bento, Editorial, Spotlight).
- Ẩn nút "Gửi hồ sơ tự do" ở **trang chi tiết việc làm** (hiện khi tin đã đóng/hết hạn).
- Chặn truy cập trực tiếp trang **/apply** — tự động chuyển về trang Việc làm.

Khi bật lại, mọi nút và trang /apply hoạt động như hiện tại. Giống hệt cách mô-đun Tin tức đang hoạt động.

## Thay đổi kỹ thuật

1. `src/lib/site-config.tsx`: thêm `openApplication: boolean` (mặc định `true`) vào `SiteConfig.modules`; `mergeConfig` tự nâng cấp cấu hình đã lưu (thiếu thì mặc định bật).
2. `src/routes/admin.settings.tsx` (tab Mô-đun): thêm hàng công tắc "Gửi hồ sơ tự do" với mô tả "Tắt sẽ ẩn nút gửi hồ sơ tự do trên trang chủ, trang việc làm và chặn trang nộp hồ sơ."
3. 5 file `src/components/home/Home*.tsx`: khối CTA chỉ hiển thị khi `cta.enabled && modules.openApplication`.
4. `src/routes/jobs.$jobId.index.tsx`: chỉ hiện nút "Gửi hồ sơ tự do" khi mô-đun bật.
5. `src/routes/apply.tsx`: khi mô-đun tắt, chuyển hướng về `/jobs`.

## Kiểm tra

- Typecheck sạch.
- Playwright: bật/tắt công tắc → Lưu → trang chủ ẩn/hiện khối CTA; tắt thì /apply chuyển về /jobs.
