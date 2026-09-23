# Git Workflow

Quy chuẩn Git cho dự án Career Portal, áp dụng mô hình **GitHub Flow**.

---

## 1. Quy ước đặt tên nhánh

Luôn tạo nhánh từ `main` mới nhất. Định dạng: `<loại>/<ten-mo-ta>`.

| Loại nhánh | Tiền tố | Ví dụ |
| :--- | :--- | :--- |
| Tính năng mới | `feat/` | `feat/salary-range-filter` |
| Sửa lỗi | `fix/` | `fix/oauth-token-expired` |
| Tái cấu trúc | `refactor/` | `refactor/database-queries` |
| Cấu hình / Tool | `chore/` | `chore/setup-eslint-prettier` |
| Tài liệu | `docs/` | `docs/api-endpoints` |

**Quy tắc:**
- Tên nhánh viết thường, dùng `-` phân tách từ.
- Ngắn gọn, mô tả đúng nội dung thay đổi.
- Luôn tạo từ `main` mới nhất, không tạo nhánh cũ.

---

## 2. Định dạng Conventional Commits

Mỗi commit message phải tuân thủ:

```text
<loại>(<phạm-vi>): <mô tả ngắn gọn>

[Chi tiết nếu cần]
```

### Tiền tố (`<loại>`):

| Tiền tố | Mục đích |
| :--- | :--- |
| `feat` | Thêm tính năng mới |
| `fix` | Sửa lỗi |
| `docs` | Tài liệu |
| `style` | Định dạng (không ảnh hưởng logic) |
| `refactor` | Tái cấu trúc code |
| `test` | Thêm/sửa test |
| `chore` | Cấu hình build, CI/CD, tooling |

### Ví dụ hợp lệ:

```
feat(jobs): add salary range filter component
fix(auth): prevent token expiry race condition
chore(ci): add GitHub Actions workflow
docs: update README with project structure
```

---

## 3. Quy trình Pull Request

### 3.1 Tạo nhánh và làm việc

```bash
git checkout main
git pull origin main
git checkout -b feat/ten-tinh-nang-moi
# ... code và commit ...
git push -u origin feat/ten-tinh-nang-moi
```

### 3.2 Mở Pull Request

1. Tạo PR từ nhánh tính năng vào `main`.
2. Đặt tiêu đề PR theo định dạng Conventional Commits.
3. Mô tả mục đích thay đổi, checklist kiểm tra.

### 3.3 Kiểm tra trước khi merge

- [ ] CI pipeline pass (TypeScript check + Build)
- [ ] Code review từ ít nhất 1 thành viên
- [ ] Không có conflict với `main`

### 3.4 Merge

- Ưu tiên **Squash and merge** để giữ lịch sử `main` gọn gàng.
- Xoá nhánh tính năng trên GitHub sau khi merge.

---

## 4. Commit tốt

- **Mỗi commit là một đơn vị thay đổi có ý nghĩa.**
- Commit phải pass TypeScript check và Build.
- Không commit `node_modules/`, `.env`, file tạm build.
- Commit message rõ ràng, mô tả đúng nội dung.
