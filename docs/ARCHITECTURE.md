# Kiến Trúc Dự Án Career Portal

## Tổng quan

Career Portal là ứng dụng web full-stack xây dựng trên **TanStack Start** (React SSR framework), sử dụng **Bun** làm runtime và package manager, **Vite** làm bundler.

---

## Stack công nghệ

| Layer | Công nghệ |
| :--- | :--- |
| Runtime | Bun |
| Framework | TanStack Start (Full-stack React SSR) |
| Bundler | Vite 8 |
| Routing | TanStack Router (file-based routing) |
| Styling | Tailwind CSS v4 |
| UI Library | Shadcn UI (Radix Primitives) |
| Forms | React Hook Form + Zod validation |
| Icons | Lucide React |
| Language | TypeScript (strict mode) |

---

## Cấu trúc thư mục

```
career-portal/
├── src/
│   ├── assets/           # Hình ảnh, static assets
│   ├── components/
│   │   ├── ui/           # Shadcn UI components (Button, Dialog, Tabs...)
│   │   ├── site/         # Components dùng chung (Header, Footer, JobCard...)
│   │   ├── admin/        # Components phân hệ quản trị
│   │   └── home/         # Các variant giao diện trang chủ
│   ├── data/             # Mock/seed data (jobs, candidates, categories)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Stores, auth, i18n, config
│   ├── routes/           # File-based routes (TanStack Router)
│   ├── router.tsx        # Cấu hình router chính
│   ├── server.ts         # Server entrypoint
│   ├── start.ts          # App entrypoint
│   └── styles.css        # Global CSS + Tailwind config
├── public/               # Static assets (favicon, robots.txt)
├── .github/workflows/    # CI/CD pipeline
├── .skills/              # Development guidelines
├── docs/                 # Tài liệu kỹ thuật
└── tasks/                # Task management
```

---

## Routing

- File-based routing trong `src/routes/`.
- Tree tự động sinh tại `src/routeTree.gen.ts` khi chạy `bun run dev`.
- Dùng `createFileRoute` để định nghĩa route mới.
- `__root.tsx` là layout root bọc toàn bộ app.

## Stores (State Management)

In-memory reactive stores trong `src/lib/`:

| Store | File | Mục đích |
| :--- | :--- | :--- |
| Jobs | `jobs-store.ts` | Tin tuyển dụng |
| Taxonomy | `taxonomy-store.ts` | Danh mục phân loại |
| News | `news-store.ts` | Tin tức |
| Inbox | `inbox-store.ts` | Hộp thư |
| Auth | `auth-store.ts` | Xác thực & phân quyền |
| Site Config | `site-config.ts` | Cấu hình site |
| Form Config | `form-config.ts` | Cấu hình form |
| Language | `language-config.ts` | Ngôn ngữ UI |

Mỗi store export `Provider` component (được mount trong `__root.tsx`) và custom hook để truy cập state.

## Build & Deploy

- `bun run build` sinh output tại `.output/` (client + SSR + Nitro).
- Preset mặc định: `cloudflare-module`.
- CI/CD: GitHub Actions — check TypeScript + build trên push/PR tới `main`.
