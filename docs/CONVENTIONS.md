# Quy Tắc & Quy Chuẩn Dự Án

## 1. Đặt tên nhánh

Luôn tạo nhánh từ `main`, dùng format `<loại>/<ten-mo-ta>`:

| Loại | Tiền tố | Ví dụ |
| :--- | :--- | :--- |
| Tính năng mới | `feat/` | `feat/salary-filter` |
| Sửa lỗi | `fix/` | `fix/login-redirect` |
| Tái cấu trúc | `refactor/` | `refactor/store-pattern` |
| Cấu hình/Tool | `chore/` | `chore/eslint-config` |
| Tài liệu | `docs/` | `docs/architecture` |

- Viết thường, dùng `-` phân tách, không quá 50 ký tự.

---

## 2. Commit Message (Conventional Commits)

```text
<loại>(<phạm-vi>): <mô tả ngắn>
```

| Loại | Mục đích |
| :--- | :--- |
| `feat` | Tính năng mới |
| `fix` | Sửa lỗi |
| `docs` | Tài liệu |
| `style` | Định dạng code (không ảnh hưởng logic) |
| `refactor` | Tái cấu trúc |
| `test` | Thêm/sửa test |
| `chore` | Cấu hình, tooling, CI/CD |

Ví dụ:
```
feat(jobs): add salary range filter
fix(auth): handle token refresh race condition
chore(ci): add GitHub Actions workflow
```

---

## 3. Clean Code Rules

- **TypeScript strict:** Không dùng `any` khi có thể chỉ rõ kiểu.
- **Functional components:** Luôn dùng function component + hooks.
- **Import alias:** Dùng `@/` thay vì `../` đường dẫn tương đối.
- **Tailwind only:** Không viết custom CSS trừ khi cần thiết.
- **Component pattern:** Shadcn pattern — `variant` via `class-variance-authority`.
- **Comment:** Chỉ comment logic không obvious, không comment code rõ ràng.
- **Trùng lặp:** Nếu code lặp lại 3 lần, extract thành component/hook/utils.

---

## 4. Route Convention

- File đặt trong `src/routes/`.
- Dùng `createFileRoute("/path")`.
- Route tree auto-gen khi `bun run dev`.
- Route con đặt cùng thư mục hoặc dùng `.` phân tách: `jobs.$jobId.index.tsx`.

---

## 5. i18n Convention

- Mọi chuỗi hiển thị phải hỗ trợ `vi` và `en`.
- Lưu nội dung trong store hoặc component data, không hardcode.
- Luôn check `currentLanguage` từ `LanguageConfigProvider` khi render.
