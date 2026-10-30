# Career Portal

Nền tảng tuyển dụng song ngữ Việt–Anh, gồm website tuyển dụng, API và khu vực quản trị nhân sự. Dự án được tổ chức theo Bun workspaces và Turborepo.

## Công nghệ

- **Runtime/package manager:** Bun `1.3.13`
- **Monorepo:** Bun workspaces, Turborepo
- **Web:** React 19, TanStack Start/Router, Vite 8, Tailwind CSS 4, Radix UI/Shadcn
- **API:** Express 4, TypeScript
- **Database:** PostgreSQL, Prisma 5
- **Validation/forms:** Zod, React Hook Form

## Cấu trúc repository

```text
career-portal/
├── apps/
│   ├── web/                     # TanStack Start: trang tuyển dụng và admin
│   │   └── src/
│   │       ├── routes/          # File-based routes; routeTree.gen.ts được tự tạo
│   │       ├── components/      # UI, site, admin
│   │       ├── lib/             # Stores, auth, cấu hình, tiện ích
│   │       └── data/            # Dữ liệu mẫu phía client
│   └── api/                     # Express API, routes, services, middleware
├── packages/
│   ├── database/                # Prisma schema, migrations, seed và DB client
│   ├── types/                   # Kiểu và validation schema dùng chung
│   └── typescript-config/       # Cấu hình TypeScript dùng chung
├── docs/                        # Tài liệu kiến trúc
├── tasks/                       # Theo dõi công việc
├── package.json                 # Scripts và workspace definitions
├── turbo.json                   # Cấu hình pipeline Turborepo
└── bun.lock                     # Lockfile
```

Web app có các store client-side và một số dữ liệu mock/in-memory; không phải mọi tính năng đều được lưu trong database. Các luồng có tích hợp API/DB được triển khai tại `apps/api` và `packages/database`.

## Yêu cầu

- Bun `1.3.13` (xem trường `packageManager` trong `package.json`)
- PostgreSQL 14 trở lên
- Git
- Node.js không bắt buộc để cài/chạy workspace; Bun là runtime dự án

## Chạy local

### 1. Lấy mã nguồn và cài dependencies

```bash
git clone <repository-url>
cd career-portal
bun install
```

PowerShell dùng các lệnh tương tự:

```powershell
git clone <repository-url>
Set-Location career-portal
bun install
```

### 2. Tạo database và cấu hình môi trường

Tạo database PostgreSQL, sau đó thiết lập `DATABASE_URL` cho Prisma. Database package đọc cấu hình này từ môi trường; có thể tạo file `packages/database/.env` ở máy phát triển.

```dotenv
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<database>?schema=public"
```

API cần file `apps/api/.env`:

```dotenv
PORT=5000
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<database>?schema=public"
CLIENT_URL="http://localhost:5173"
JWT_SECRET="<secret-ngau-nhien-it-nhat-32-byte-khi-production>"
JWT_ISSUER="career-portal-api"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL_DAYS="7"
```

Không commit file `.env` hoặc đưa thông tin xác thực thật vào README/log. Trong production, đặt `NODE_ENV=production`, tạo `JWT_SECRET` ngẫu nhiên có tối thiểu 32 bytes và đặt các biến môi trường qua secret store của máy chủ hoặc hệ thống triển khai.

### 3. Tạo schema và dữ liệu

Migration hiện tại là một baseline tạo schema final cho database mới. Database đã ghi nhận các migration cũ không tự áp dụng baseline này; giữ nguyên dữ liệu hiện có và xử lý riêng trước khi dùng baseline.

Lệnh API dev tự chạy migration và seed dữ liệu mẫu trước khi khởi động. Cần PostgreSQL đang hoạt động và `DATABASE_URL` hợp lệ. Có thể chạy setup độc lập:

```bash
bun run db:setup:dev
```

Có thể chạy riêng:

```bash
bun run db:migrate:dev
bun run db:seed:dev
```

`db:seed:dev` tạo dữ liệu phát triển/mẫu. Chỉ chạy seed production khi đã kiểm tra mã seed: chế độ production chỉ tạo admin nền tảng và cấu hình site mặc định, không tạo dữ liệu mẫu. Đổi mật khẩu khởi tạo admin theo biến `INITIAL_ADMIN_PASSWORD` trước khi seed production.

### 4. Khởi động ứng dụng

Mở hai terminal tại repository root:

```bash
# Terminal 1: API, http://localhost:5000
bun --filter @career-portal/api dev
```

```bash
# Terminal 2: Web, http://localhost:5173
bun --filter @career-portal/web dev
```

Web development server proxy các đường dẫn `/api` và `/uploads` tới API ở cổng `5000`.

## Scripts thường dùng

| Lệnh | Tác dụng |
| --- | --- |
| `bun run dev` | Chạy các workspace dev qua Turbo |
| `bun run build` | Build các workspace có khai báo script build |
| `bun run lint` | Chạy lint ở các workspace có script lint |
| `bun x tsc --noEmit` | Typecheck theo cấu hình root/CI |
| `bun run db:migrate:dev` | Tạo/chạy migration phát triển |
| `bun run db:migrate:prod` | Áp dụng migrations đã tạo trên production |
| `bun run db:seed:dev` | Seed dữ liệu phát triển |
| `bun run db:seed:prod` | Seed dữ liệu tối thiểu production; chỉ dùng sau khi cấu hình mật khẩu admin |
| `bun run db:setup:dev` | Chạy migration phát triển rồi seed dữ liệu mẫu |
| `bun --filter @career-portal/database db:studio` | Mở Prisma Studio |

Không có test runner được cấu hình trong repository hiện tại. CI chạy typecheck và build.

## Triển khai production

### Lưu ý về build web

Cấu hình Vite/TanStack Start hiện dùng Nitro với Cloudflare làm preset mặc định. Vì vậy, không giả định output mặc định có thể chạy trực tiếp như Node/Bun server trên Windows Server hoặc Linux. Trước khi triển khai standalone, hãy chọn Nitro preset/adapter phù hợp với hạ tầng đích, build và xác nhận lệnh chạy/output theo preset đó. `vite preview` dành cho kiểm tra build, không phải production server.

Một kiến trúc triển khai phổ biến là reverse proxy HTTPS phía trước web và API; PostgreSQL chỉ mở cho các máy cần truy cập. Cấu hình domain, TLS, giới hạn upload, firewall và chính sách backup theo môi trường của bạn. Không expose cổng database ra Internet.

### Windows Server

Các bước dưới đây mô tả cấu hình máy chủ; cần xác nhận phiên bản Bun, Nitro preset và cách quản lý service tương thích với môi trường đích trước khi go-live.

1. Cài Git, Bun phiên bản `1.3.13` và PostgreSQL; tạo database/user riêng cho ứng dụng. Giới hạn quyền user database ở database/schema cần thiết.
2. Checkout mã nguồn vào thư mục ứng dụng, ví dụ `C:\apps\career-portal`, rồi chạy `bun install --frozen-lockfile`.
3. Cấu hình biến môi trường production cho API: `NODE_ENV=production`, `PORT`, `DATABASE_URL`, `CLIENT_URL` là URL HTTPS của website, `JWT_SECRET` (ít nhất 32 bytes), `JWT_ISSUER`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_DAYS`, và `INITIAL_ADMIN_PASSWORD` nếu cần seed admin lần đầu. Không lưu secrets trong source control.
4. Chọn Nitro preset hỗ trợ target Windows/Bun/Node của bạn; build và kiểm tra artifact theo tài liệu preset. Không chạy `bun run dev` trên production.
5. Chạy migrations đã được kiểm tra bằng `bun run db:migrate:prod`. Nếu khởi tạo lần đầu, thiết lập mật khẩu admin mạnh rồi chạy seed production có kiểm soát.
6. Đăng ký API và web runtime như Windows Services bằng service manager được tổ chức phê duyệt. Thiết lập working directory, biến môi trường, tự khởi động lại khi lỗi và log rotation; chỉ bind cổng nội bộ.
7. Cấu hình IIS với URL Rewrite/ARR hoặc reverse proxy đã được phê duyệt để chuyển tiếp HTTPS đến web/API. Chuyển tiếp `/api` và `/uploads` tới API phù hợp với routing của ứng dụng; kiểm tra `CLIENT_URL`, cookie HTTPS, upload và CORS.
8. Mở firewall chỉ các cổng cần thiết (thường 80/443 ở proxy); không mở trực tiếp cổng PostgreSQL/API ra Internet. Cấu hình TLS, backup PostgreSQL định kỳ và quy trình khôi phục.

### Linux (Ubuntu/Debian)

1. Cài Git, PostgreSQL và Bun `1.3.13` theo hướng dẫn chính thức cho distro. Tạo database/user ứng dụng riêng và giới hạn truy cập mạng database.
2. Checkout mã nguồn vào thư mục triển khai, chẳng hạn `/srv/career-portal`, rồi chạy `bun install --frozen-lockfile`.
3. Đặt biến môi trường production an toàn cho API (systemd `EnvironmentFile` với quyền đọc hạn chế hoặc secret manager): `NODE_ENV=production`, `PORT`, `DATABASE_URL`, `CLIENT_URL`, `JWT_SECRET` (tối thiểu 32 bytes), các thiết lập JWT và `INITIAL_ADMIN_PASSWORD` khi seed lần đầu. Không commit file secrets.
4. Cấu hình Nitro preset/adapter phù hợp với target Linux/Bun/Node trước khi build. Chạy `bun run build`, kiểm tra output và xác định chính xác lệnh khởi chạy production từ preset đã chọn.
5. Áp dụng migrations bằng `bun run db:migrate:prod`; seed production chỉ khi cần tạo admin/config ban đầu và đã đặt mật khẩu mạnh.
6. Tạo systemd unit riêng cho API và web runtime; chạy bằng user hệ thống không có quyền đăng nhập, đặt working directory, biến môi trường, restart policy và giới hạn quyền file. Chỉ bind các service vào localhost/private network.
7. Cấu hình Nginx/Caddy làm reverse proxy HTTPS tới web và API; cấu hình forwarding cho `/api` và `/uploads`, giới hạn kích thước request tương ứng với upload CV, bật TLS và gửi đúng `CLIENT_URL`.
8. Dùng firewall chỉ cho phép 80/443 (và SSH quản trị theo chính sách); không expose PostgreSQL. Thiết lập backup/restore, log rotation, giám sát sức khỏe và quy trình cập nhật.

### Cập nhật phiên bản

1. Sao lưu database và xác nhận có thể khôi phục.
2. Triển khai mã nguồn/dependencies theo lockfile và build với đúng preset production.
3. Chạy `bun run db:migrate:prod` trong cửa sổ triển khai đã định, sau đó restart services.
4. Kiểm tra trang web, đăng nhập admin, API, upload và log. Có kế hoạch rollback tương thích với migration; không tự ý rollback migration phá huỷ dữ liệu.

## Tài liệu liên quan

- [Kiến trúc dự án](docs/ARCHITECTURE.md)
- [Hướng dẫn cho người đóng góp và lệnh repository](CLAUDE.md)
- [CI workflow](.github/workflows/ci.yml)
