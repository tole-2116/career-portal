# 🌟 Career Portal (Nền Tảng Tuyển Dụng Trực Tuyến)

> Hệ thống tuyển dụng và cổng thông tin việc làm hiện đại, hỗ trợ ứng viên tìm kiếm cơ hội nghề nghiệp, nộp hồ sơ trực tuyến và cung cấp bảng điều khiển quản trị (Admin/HR) toàn diện.

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Framework:** [TanStack Start](https://tanstack.com/start) (Full-stack React Framework) + [Vite](https://vitejs.dev/)
- **Routing:** TanStack Router (File-based Routing tự động tạo tại `src/routeTree.gen.ts`)
- **Styling & UI Components:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
- **Icons:** Lucide React
- **Data & State Management:** In-memory Reactive Stores (Jobs, Candidates, Taxonomy, News, Inbox)
- **Quốc tế hóa (i18n):** Hỗ trợ song ngữ Tiếng Việt & Tiếng Anh

---

## 📂 Cấu Trúc Thư Mục (Project Structure)

```text
career-portal/
├── .github/
│   └── workflows/
│       └── ci.yml               # Pipeline CI/CD tự động (Bun, Typecheck, Build, Deploy)
├── public/                      # Static assets công khai (favicon, robots.txt)
├── src/
│   ├── assets/                  # Hình ảnh thương hiệu, cover văn phòng, ban lãnh đạo
│   ├── components/
│   │   ├── admin/               # Layout, trình soạn thảo, form quản trị
│   │   ├── home/                # Các biến thể giao diện trang chủ (Classic, Bento, Split, Spotlight)
│   │   ├── site/                # Header, Footer, Hero Carousel, JobCard dùng chung
│   │   └── ui/                  # Bộ UI Component của Shadcn (Button, Dialog, Sheet, Tabs,...)
│   ├── data/                    # Dữ liệu ban đầu (mock data về jobs, candidates, categories)
│   ├── hooks/                   # Custom React hooks (use-mobile,...)
│   ├── lib/                     # Cấu hình stores, xác thực, phân quyền (auth, i18n, site-config)
│   ├── routes/                  # File-based routes của TanStack Router
│   │   ├── __root.tsx           # Layout root ứng dụng
│   │   ├── index.tsx            # Trang chủ
│   │   ├── jobs.index.tsx       # Danh sách tin tuyển dụng & bộ lọc
│   │   ├── jobs.$jobId.index.tsx# Chi tiết tin tuyển dụng
│   │   ├── jobs.$jobId.apply.tsx# Form nộp CV & ứng tuyển
│   │   ├── about.tsx            # Giới thiệu công ty & văn hóa
│   │   ├── news.index.tsx       # Tin tức & cẩm nang nghề nghiệp
│   │   ├── contact.tsx          # Liên hệ
│   │   └── admin.*.tsx          # Toàn bộ phân hệ quản trị (Jobs, Candidates, Users, Forms, Settings)
│   ├── router.tsx               # Cấu hình router chính
│   ├── server.ts / start.ts     # Entrypoint máy chủ TanStack Start
│   └── styles.css               # Cấu hình CSS toàn cục
├── bun.lock / bunfig.toml       # Quản lý dependencies với Bun
├── components.json              # Cấu hình Shadcn UI
├── package.json                 # Khai báo dependencies và scripts
├── tsconfig.json                # Cấu hình TypeScript
└── vite.config.ts               # Cấu hình build Vite
```

---

> **Mẹo nhanh:** Bạn có thể copy đoạn prompt sau và ném vào ô chat **Claude Code** ở bên phải để Claude tự động ghi đè file giúp bạn:
>
> ```text
> Hãy cập nhật toàn bộ nội dung file README.md theo cấu trúc chuẩn của dự án career-portal (TanStack Start, Bun, Vite, Tailwind/Shadcn, i18n, các lệnh bun run dev/build và mô tả cấu trúc thư mục src/).
> ```
