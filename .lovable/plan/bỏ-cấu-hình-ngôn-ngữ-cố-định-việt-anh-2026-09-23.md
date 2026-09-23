# Bỏ cấu hình ngôn ngữ, cố định Việt – Anh

## Thay đổi

- Xoá tab "Ngôn ngữ" trong Cấu hình giao diện (kèm khối bật/tắt, sắp xếp, chọn ngôn ngữ mặc định).
- Hệ thống cố định hai ngôn ngữ: Tiếng Việt và English; Tiếng Việt là ngôn ngữ mặc định khi thiếu nội dung.
- Các ô nhập nội dung trong quản trị (tin tuyển dụng, danh mục, biểu mẫu, tin tức, cấu hình) chỉ còn hai tab Tiếng Việt | English.
- Nút chọn ngôn ngữ ở đầu trang quản trị chỉ còn Tiếng Việt và English; công tắc VI/EN ở trang công khai giữ nguyên.
- Bỏ qua thiết lập ngôn ngữ cũ đã lưu trên máy (nếu ai đó từng bật Hàn/Nhật/Trung), không cần thao tác gì thêm.

## Chi tiết kỹ thuật

- `src/lib/language-config.tsx`: rút gọn còn hằng số `availableLanguages = [vi, en]`, `languageLabel`, `languageShort`, và `useLanguageConfig()` trả cố định `{ enabled: ["vi", "en"], fallback: "vi" }`; bỏ state/localStorage `talenthub-languages` cùng `toggle`/`move`/`setFallback`/`reset`. Giữ `LanguageConfigProvider` như một wrapper rỗng để `__root.tsx` không phải đổi (hoặc gỡ luôn khỏi `__root.tsx`).
- `src/routes/admin.settings.tsx`: xoá `LanguagesPanel`, `TabsTrigger value="languages"`, `TabsContent` tương ứng và import `availableLanguages`/`useLanguageConfig`; dọn import không dùng (`ArrowUp`/`ArrowDown` nếu không còn nơi khác dùng).
- Không đổi `LocalizedInput.tsx`, `admin.news.tsx`, `LanguageToggle.tsx`, `i18n.tsx` — chúng tự nhận danh sách hai ngôn ngữ từ hook.
- Chạy typecheck và kiểm tra nhanh /admin/settings, /admin/jobs bằng Playwright.
