# Career Portal — triển khai trên IIS

Thư mục này là một bản release hoàn chỉnh, được tạo bởi `bun run build` (tại `deploy/career-portal`).

```text
career-portal/
├── deploy.ps1        # deploy bằng một lệnh (backup, migrate, IIS, health check)
├── setup-iis.ps1     # chỉ cấu hình IIS và trỏ site vào release này
├── web/              # TanStack Start (Nitro node-server) + web.config
└── api/              # Express API đã bundle + Prisma client/engine + web.config
```

## Kiến trúc trên IIS

| IIS | Trỏ tới | Xử lý bởi |
| --- | --- | --- |
| Site `career-portal` | `web\` | Node (SSR) qua ASP.NET Core Module, pool `career-portal-web` |
| Application `/api` | `api\` | Node (Express) qua ASP.NET Core Module, pool `career-portal-api` |
| Virtual directory `/uploads` | `<DataDir>\uploads` | IIS static file (không qua Node) |

ASP.NET Core Module V2 khởi chạy `node.exe`, cấp cổng nội bộ ngẫu nhiên, tự khởi động lại khi tiến trình chết và proxy request tới Node. Không cần URL Rewrite/ARR hay NSSM/PM2. Asset tĩnh của web (`/assets/*`) được nén sẵn Brotli/Gzip và có `Cache-Control: immutable`.

Mặc định mọi thứ nằm trên **ổ D**: các release ở `D:\sites\career-portal\releases\<thời-gian>`, IIS trỏ site vào release đang chạy. Dữ liệu cố định nằm ngoài release, tại `<DataDir>` (mặc định `D:\sites\career-portal\data`): `api.env` (bí mật API), `uploads\` (CV, ảnh tin tức) và `logs\web`, `logs\api` (stdout Node).

## Yêu cầu máy chủ

1. IIS với **Static Content** (khuyến nghị thêm **Application Initialization** để khởi động sẵn).
2. **ASP.NET Core Hosting Bundle** (cung cấp ASP.NET Core Module V2).
3. **Node.js 20+** cài cho mọi user (có `node.exe` trong PATH hệ thống).
4. PostgreSQL truy cập được từ máy chủ.

## Deploy bằng một lệnh

Chép thư mục `career-portal` lên máy chủ (ở bất kỳ đâu), mở PowerShell tại thư mục đó và chạy:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -HostName "tuyendung.example.com"
```

Nếu máy build cũng là máy chủ IIS, chạy tại thư mục repo (build + deploy):

```bash
bun run deploy:iis -- -HostName "tuyendung.example.com"
```

`deploy.ps1` tự xin quyền Administrator (UAC) và lần lượt:

1. Chép release vào `D:\sites\career-portal\releases\<thời-gian>`.
2. Lần đầu: hỏi `DATABASE_URL`, `CLIENT_URL`, tự sinh `JWT_SECRET` và lưu vào `<DataDir>\api.env` (chỉ Administrators/SYSTEM và app pool API đọc được). Các lần sau giữ nguyên file; nếu truyền `-DatabaseUrl` / `-ClientUrl` thì hai giá trị đó được ghi đè (giữ `JWT_SECRET`).
3. Sao lưu database bằng `pg_dump` vào `<DataDir>\backups` (nếu có `pg_dump` trong PATH).
4. Chạy migration: `npx prisma migrate deploy`, đúng phiên bản Prisma của release (cần Internet).
5. Cấu hình IIS và chuyển site sang release mới (`setup-iis.ps1`).
6. Kiểm tra sức khỏe; nếu lỗi, tự chuyển IIS về release trước (migration không bị hoàn tác).
7. Giữ 5 release mới nhất, xóa các release cũ hơn.

Log mỗi lần deploy: `<DataDir>\logs\deploy-<thời-gian>.log`. Các lần cập nhật sau chạy đúng lệnh trên với release mới.

| Tham số | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `-HostName` | rỗng (mọi host) | Tên miền của site |
| `-Port` | `80` | Cổng HTTP public |
| `-InternalPort` | `8089` | Binding chỉ trên 127.0.0.1 để SSR gọi API qua IIS |
| `-SiteName` | `career-portal` | Tên site và tiền tố app pool |
| `-DataDir` | `<InstallRoot>\data` | `api.env`, uploads, log, backup |
| `-InstallRoot` | `D:\sites\career-portal` | Nơi chứa các release (đổi ổ đĩa: `-InstallRoot E:\sites\career-portal`) |
| `-KeepReleases` | `5` | Số release giữ lại |
| `-DatabaseUrl`, `-ClientUrl` | hỏi khi cần | Lần đầu: tạo `api.env` không cần nhập tay. Lần sau: ghi đè giá trị trong `api.env` (ví dụ đổi mật khẩu DB) |
| `-SkipBackup`, `-SkipMigrate` | tắt | Bỏ qua backup / migration |
| `-NodePath` | dò từ PATH | Đường dẫn `node.exe` |

Nếu dùng cổng 80 không có `-HostName`, cần dừng **Default Web Site** (hoặc đổi cổng) để tránh trùng binding. Binding HTTPS + chứng chỉ thêm trong IIS Manager. Seed admin lần đầu (`bun run db:seed:prod`) chạy từ máy build.

### Chế độ thư mục cố định (`-TargetDir`)

Dùng khi site IIS luôn trỏ vào một thư mục cố định thay vì các release theo thời gian, ví dụ site `career.portal.vn` trỏ vào `D:\Rec.Project\career-portal\web`:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -TargetDir "D:\Rec.Project\career-portal" -SiteName "career.portal.vn" -HostName "career.portal.vn"
```

Script đặt `app_offline.htm` (Node dừng, khách thấy trang bảo trì), đồng bộ `web\`, `api\` mới vào thư mục đích (giữ `logs\`), rồi cấu hình IIS. Dữ liệu nằm ở `<TargetDir>\data`. Chế độ này không tự rollback vì chỉ có một bản.

**Rollback thủ công:** chạy `.\setup-iis.ps1` (cùng tham số) trong một thư mục release cũ dưới `D:\sites\career-portal\releases`.

## Kiểm tra sự cố

- Log Node: `<DataDir>\logs\web\node_*.log`, `<DataDir>\logs\api\node_*.log`.
- Lỗi `502.5`/`500.30`: Node không khởi động được — xem log trên; kiểm tra `api.env`, kết nối database, đường dẫn `node.exe` trong `web.config`.
- Bảo trì: đặt file `app_offline.htm` vào `web\` hoặc `api\` để IIS dừng Node và trả trang bảo trì.
- Lưu ý: file trong `/uploads` (kể cả CV) được phục vụ công khai theo tên file ngẫu nhiên, giống hành vi API hiện tại.
