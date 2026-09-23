# Code Style & Architecture

Quy chuẩn kiến trúc và code style cho dự án Career Portal.

---

## 1. Kiến trúc dự án

| Thành phần | Công nghệ |
| :--- | :--- |
| Runtime & Package Manager | [Bun](https://bun.sh/) |
| Framework | [TanStack Start](https://tanstack.com/start) (Full-stack React) |
| Bundler | [Vite](https://vitejs.dev/) |
| Routing | TanStack Router (file-based, tự động tại `src/routeTree.gen.ts`) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) v4 |
| UI Components | [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Language | TypeScript (strict mode) |

---

## 2. Tạo route mới

Routes nằm trong `src/routes/` và sử dụng **file-based routing** của TanStack Router.

### Quy tắc đặt tên file:

| File | Đường dẫn URL |
| :--- | :--- |
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `jobs.index.tsx` | `/jobs` |
| `jobs.$jobId.index.tsx` | `/jobs/$jobId` |
| `jobs.$jobId.apply.tsx` | `/jobs/$jobId/apply` |
| `admin._layout.tsx` | Layout wrapper cho `/admin/*` |

### Bước tạo route mới:

1. Tạo file mới trong `src/routes/`, ví dụ `news.index.tsx`.
2. Định nghĩa `Route`使用 `createFileRoute`:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/news")({
  component: NewsPage,
});

function NewsPage() {
  return <div>...</div>;
}
```

3. **`routeTree.gen.ts` sẽ tự động cập nhật** khi chạy `bun run dev`.
4. Nếu route cần layout chung, sử dụng `__root.tsx` hoặc tạo `_layout.tsx`.

---

## 3. Xử lý đa ngôn ngữ (i18n)

Dự án hỗ trợ song ngữ Tiếng Việt & Tiếng Anh.

### Cấu trúc:

- **Store:** `src/lib/language-config.ts` — quản lý ngôn ngữ hiện tại.
- **Provider:** `LanguageConfigProvider` bọc toàn bộ app trong `__root.tsx`.
- **Hook:** Sử dụng store để lấy nội dung theo ngôn ngữ.

### Quy tắc:

- Luôn lưu cả 2 phiên bản ngôn ngữ trong dữ liệu.
- Sử dụng key `vi` và `en` cho mỗi chuỗi.
- Component hiển thị phải render theo `currentLanguage` từ store.

---

## 4. Reactive Stores

Dữ liệu quản lý bằng in-memory reactive stores trong `src/lib/`:

| Store | File | Mục đích |
| :--- | :--- | :--- |
| Jobs | `jobs-store.ts` | Tin tuyển dụng |
| Taxonomy | `taxonomy-store.ts` | Danh mục (ngành nghề, loại hình...) |
| News | `news-store.ts` | Tin tức |
| Inbox | `inbox-store.ts` | Hộp thư |
| Auth | `auth-store.ts` | Xác thực & phân quyền |
| Site Config | `site-config.ts` | Cấu hình site (logo, màu sắc...) |
| Form Config | `form-config.ts` | Cấu hình form ứng tuyển |

### Quy tắc:

- Mỗi store export `Provider` component và custom hook.
- `Provider` phải được mount trong `__root.tsx`.
- Không import trực tiếp state từ store — luôn dùng hook.
- Cập nhật dữ liệu qua các hàm mutation trong store.

---

## 5. UI Components (Shadcn)

- Component gốc nằm trong `src/components/ui/`.
- Component chung của site nằm trong `src/components/site/`.
- Component admin nằm trong `src/components/admin/`.
- Component home variants nằm trong `src/components/home/`.

### Quy tắc:

- Import component từ `@/components/ui/` (không import trực tiếp từ `@radix-ui`).
- Sử dụng utility `cn()` từ `@/lib/utils` để merge class.
- Follow pattern của Shadcn khi thêm component mới.
