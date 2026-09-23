# Testing & Build

Các lệnh kiểm tra chất lượng và quy trình sửa lỗi trước khi commit.

---

## 1. Các lệnh kiểm tra

### TypeScript Check

```bash
bun x tsc --noEmit
```

- Kiểm tra lỗi type mà không sinh file output.
- **Phải pass 100%** trước khi commit.

### Lint

```bash
bun run lint
```

- Chạy ESLint trên toàn bộ dự án.
- Sửa các lỗi format và code style theo quy chuẩn.

### Format

```bash
bun run format
```

- Chạy Prettier để tự động định dạng code.

### Build

```bash
bun run build
```

- Build production (client + SSR + Nitro).
- **Phải pass 100%** trước khi commit.

### Dev Server

```bash
bun run dev
```

- Chạy local development server.
- Sử dụng để kiểm tra trực quan trước khi commit.

---

## 2. Quy trình kiểm tra trước commit

Trước khi tạo commit, luôn chạy tuần tự:

```bash
# 1. Kiểm tra type
bun x tsc --noEmit

# 2. Lint
bun run lint

# 3. Build
bun run build
```

Nếu bất kỳ lệnh nào bị lỗi:

1. **Đọc kỹ thông báo lỗi** — TypeScript hiển thị file và dòng lỗi cụ thể.
2. **Sửa lỗi** tại file được chỉ ra.
3. **Chạy lại lệnh** để xác nhận đã fix.
4. **Không commit** khi còn lỗi.

---

## 3. Xử lý lỗi thường gặp

### Lỗi Type (`tsc`)

```
error TS2XXX: Property 'xyz' does not exist on type '...'
```

→ Kiểm tra lại kiểu dữ liệu, đảm bảo import đúng type.

### Lỗi Lint (`eslint`)

```
Unexpected any. Specify a different type
```

→ Thay `any` bằng kiểu cụ thể hoặc `unknown`.

### Lỗi Build (`vite`)

```
Module not found: Can't resolve './component'
```

→ Kiểm tra lại đường dẫn import, đảm bảo file tồn tại.

---

## 4. Checklist trước khi tạo PR

- [ ] `bun x tsc --noEmit` — pass
- [ ] `bun run lint` — pass (hoặc chỉ có warning không mới)
- [ ] `bun run build` — pass
- [ ] Dev server chạy ổn định (`bun run dev`)
- [ ] Kiểm tra trực quan trên trình duyệt
- [ ] Commit message đúng định dạng Conventional Commits
