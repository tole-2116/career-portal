# Hướng Dẫn & Quy Chuẩn Quản Lý Source Code (Git & VS Code)

Tài liệu này cung cấp quy chuẩn phân nhánh, cách đặt tên commit, thiết lập ban đầu và các thao tác Git trực tiếp trên Visual Studio Code (VS Code) dành cho thành viên nhóm hoặc Agent AI khi khởi tạo và phát triển dự án.

---

## 1. Hướng Dẫn Dành Cho AI Khi Khởi Tạo Dự Án Mới (System Prompt)

Nếu bạn là AI được giao nhiệm vụ khởi tạo một dự án mới, hãy tuân thủ các bước bắt buộc sau:

1. **Khởi tạo Git repo:** Chạy `git init` tại thư mục gốc.
2. **Tạo `.gitignore` ngay lập tức:** Không được commit các thư mục dependencies (`node_modules`, `.venv`, `vendor`), file môi trường (`.env`, `.env.local`), file tạm build (`dist`, `build`, `.next`), hoặc file cấu hình cá nhân của VS Code (`.vscode/settings.json` nếu có chứa token/path tuyệt đối).
3. **Thiết lập nhánh mặc định:** Đảm bảo nhánh chính tên là `main` (`git branch -M main`).
4. **Commit đầu tiên (Initial Commit):**
   * Bao gồm: `README.md`, `.gitignore`, `GIT_WORKFLOW.md`, cấu trúc thư mục rỗng cơ bản hoặc scaffolding ban đầu.
   * Message commit chuẩn: `feat: initial project setup` hoặc `chore: initial repository structure`.
5. **Đưa lên Remote GitHub:** Cung cấp sẵn lệnh liên kết remote (`git remote add origin <URL>`) và push nhánh `main`.

---

## 2. Chiến Lược Phân Nhánh (Branching Strategy)

Dự án áp dụng mô hình **GitHub Flow chuẩn** (phù hợp với hầu hết dự án web, API, CI/CD hiện đại):

```
(main) ────●────────────●─────────────● (Deploy Production)
            \          /             /
(feature)    ●───●────● (PR & Merge) /
                       \            /
(bugfix)                ●──────────●
```

### 2.1. Quy ước đặt tên nhánh
Luôn tạo nhánh từ `main` mới nhất:

| Loại nhánh | Cú pháp | Ví dụ |
| :--- | :--- | :--- |
| Tính năng mới | `feat/<ten-tinh-nang>` hoặc `feature/<ten-tinh-nang>` | `feat/user-authentication` |
| Sửa lỗi | `fix/<ten-loi>` hoặc `bugfix/<issue-id>` | `fix/oauth-token-expired` |
| Tối ưu / Refactor | `refactor/<khu-vuc>` | `refactor/database-queries` |
| Tài liệu | `docs/<chu-de>` | `docs/api-endpoints` |
| Cấu hình CI/CD / Tool | `chore/<noi-dung>` | `chore/setup-eslint-prettier` |

---

## 3. Quy Ước Commit Message (Conventional Commits)

Mỗi commit message phải tuân thủ định dạng:

```text
<loai>(<pham-vi>): <mo-ta-ngan-gon>

[mo-ta-chi-tiet-neu-co]
```

### Các tiền tố (`<loai>`):
* `feat`: Thêm chức năng/tính năng mới cho người dùng hoặc API.
* `fix`: Sửa lỗi (bug fix).
* `docs`: Thêm hoặc chỉnh sửa tài liệu.
* `style`: Sửa định dạng, thụt dòng, chấm phẩy (không ảnh hưởng logic code).
* `refactor`: Tái cấu trúc code (không thêm tính năng, không sửa bug).
* `test`: Thêm hoặc sửa test case.
* `chore`: Cập nhật cấu hình build, package manager, file CI/CD.

### Ví dụ hợp lệ:
* `feat(auth): add JWT login and refresh token endpoint`
* `fix(cart): prevent adding out-of-stock items to cart`
* `chore(deps): upgrade prisma to version 5.x`

---

## 4. Hướng Dẫn Thao Tác Bằng VS Code

VS Code hỗ trợ giao diện đồ họa **Source Control** (`Ctrl + Shift + G` trên Windows/Linux hoặc `Cmd + Shift + G` trên macOS) và tích hợp sẵn Terminal (`Ctrl + \``).

### Bước 1: Khởi tạo & Clone dự án
* **Nếu clone dự án đã có trên GitHub:**
  * Mở VS Code > Nhấn `F1` (hoặc `Ctrl + Shift + P`) > Gõ `Git: Clone` > Dán link repository > Chọn thư mục lưu.
* **Nếu tạo dự án mới từ máy cục bộ:**
  ```bash
  git init
  git branch -M main
  ```

### Bước 2: Tạo nhánh mới để làm việc
Trước khi code bất kỳ tính năng nào, luôn kéo code mới nhất từ `main` và rẽ nhánh:

```bash
git checkout main
git pull origin main
git checkout -b feat/ten-tinh-nang-moi
```
*(Trên VS Code: Click vào tên nhánh ở góc dưới cùng bên trái > Chọn **Create new branch from...** > Chọn `main`).*

### Bước 3: Lưu thay đổi (Stage & Commit)
1. Trong tab **Source Control** của VS Code:
   * Nhấn dấu `+` cạnh file để đưa vào **Staged Changes** (tương đương `git add <file>`).
   * Hoặc nhấn dấu `+` cạnh mục **Changes** để stage toàn bộ (`git add .`).
2. Nhập commit message chuẩn vào ô text box.
3. Nhấn tổ hợp `Ctrl + Enter` (hoặc click nút **Commit**).

### Bước 4: Push nhánh lên GitHub
Lần đầu push nhánh mới:
```bash
git push -u origin feat/ten-tinh-nang-moi
```
*(Trên VS Code: Nhấn nút **Publish Branch** hiển thị ở thanh trạng thái hoặc sidebar Source Control).*

### Bước 5: Mở Pull Request (PR) & Merge
1. Truy cập repo trên GitHub, nhấn **Compare & pull request**.
2. Điền thông tin mô tả: mục đích thay đổi, checklist kiểm tra.
3. Gán Reviewer để duyệt code.
4. Khi review hoàn tất và CI test thành công: chọn **Squash and merge** để giữ lịch sử nhánh `main` luôn gọn gàng và sạch sẽ.
5. Xoá nhánh tính năng trên GitHub sau khi merge.

---

## 5. Mẫu `.gitignore` Tiêu Chuẩn

Tạo file `.gitignore` ở thư mục gốc với các mục cơ bản sau:

```gitignore
# Dependencies
node_modules/
vendor/
.venv/
__pycache__/

# Environment variables & secrets (QUAN TRỌNG: Không commit)
.env
.env.*
!.env.example

# Build outputs
dist/
build/
out/
.next/

# Logs
*.log
npm-debug.log*
yarn-debug.log*

# OS / Editor specific
.DS_Store
Thumbs.db
.vscode/*
!.vscode/extensions.json
!.vscode/launch.json
```

---

## 6. Xử Lý Khi Có Xung Đột (Merge Conflict) Trên VS Code

Khi nhánh của bạn bị lệch so với `main` và xuất hiện conflict:
1. Kéo code mới nhất từ `main` về nhánh đang làm:
   ```bash
   git fetch origin
   git merge origin/main
   ```
2. VS Code sẽ tự động mở giao diện **3-way Merge Editor**:
   * Nhấn **Accept Current Change** (giữ code nhánh của bạn).
   * Nhấn **Accept Incoming Change** (lấy code từ `main`).
   * Nhấn **Accept Both Changes** (giữ cả hai).
3. Sau khi xử lý xong conflict ở tất cả các file:
   ```bash
   git add .
   git commit -m "fix(merge): resolve conflicts with main branch"
   git push origin feat/ten-tinh-nang-moi
   ```