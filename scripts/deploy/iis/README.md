# Career Portal — triển khai trên IIS

Thư mục này là bản release hoàn chỉnh, được tạo bởi `bun run build` (tại `deploy/career-portal`). Bản này dùng được cho mọi môi trường và mọi domain: **không có cấu hình nào gắn với domain, tên site hay cổng**. Chỉ cần làm ba việc:

1. Chép thư mục lên server.
2. Tạo `data\api.env` (chuỗi kết nối database).
3. Trong IIS Manager, **Add Website** trỏ vào `web`, rồi **Add Application** `api` trỏ vào `api`.

```text
career-portal/
├── web/                  ← Add Website trỏ vào đây
├── api/                  ← Add Application "api" trỏ vào đây
├── data/
│   └── api.env.example   ← chép thành api.env, sửa DATABASE_URL
├── tools/                (tùy chọn) script hỗ trợ: kiểm tra site, đặt lại mật khẩu admin, ...
├── deploy.ps1, setup-iis.ps1   (tùy chọn) cách deploy bằng script, xem cuối tài liệu
└── README.md
```

## Yêu cầu máy chủ (cài một lần)

1. IIS có **Static Content**. Nên cài thêm **Application Initialization**.
2. **ASP.NET Core Hosting Bundle** (để có ASP.NET Core Module V2). Cài xong chạy `iisreset`.
3. **Node.js 20+** cài cho mọi user, để `node.exe` có trong PATH hệ thống. Cài Node xong chạy `iisreset`.
4. **PostgreSQL**, cùng máy hoặc máy khác.

Không cần Internet trên server: Prisma CLI để chạy migration đã có sẵn trong `api\node_modules`.

## Cài đặt

### Bước 1: Chép thư mục lên server

Ví dụ chép vào `D:\HRIS\DQC\Source\HRISCareer`. Nếu chép bằng zip, sau khi giải nén chạy lệnh sau:

```powershell
Get-ChildItem -Recurse "D:\HRIS\DQC\Source\HRISCareer" | Unblock-File
```

### Bước 2: Tạo database (nếu chưa có)

Dùng pgAdmin hoặc `psql` (thay mật khẩu; nên chỉ dùng chữ và số):

```sql
CREATE USER hriscareer_dqc WITH PASSWORD 'MatKhauDB2026';
CREATE DATABASE hriscareer_dqc OWNER hriscareer_dqc;
```

Không cần tạo bảng hay seed dữ liệu: API tự làm khi khởi động.

### Bước 3: Tạo `data\api.env`

Chép `data\api.env.example` thành `data\api.env`, rồi sửa hai dòng:

```ini
DATABASE_URL="postgresql://hriscareer_dqc:MatKhauDB2026@localhost:5433/hriscareer_dqc?schema=public"
INITIAL_ADMIN_PASSWORD="MatKhauAdmin@2026"
```

- Nếu mật khẩu DB có ký tự đặc biệt, phải mã hóa chúng trong `DATABASE_URL`: `@` → `%40`, `#` → `%23`, `!` → `%21`.
- `INITIAL_ADMIN_PASSWORD` dùng để tạo tài khoản `admin@careerportal.com` ở lần chạy đầu. Đăng nhập được rồi thì xóa giá trị này.
- `JWT_SECRET` không cần khai báo: lần chạy đầu sẽ tự sinh vào `data\jwt-secret.txt`.

### Bước 4: Add Website trong IIS Manager

Chuột phải **Sites** → **Add Website...**:

| Ô | Giá trị |
| --- | --- |
| Site name | tùy ý, ví dụ `HRISCareer-DQC` |
| Physical path | `D:\HRIS\DQC\Source\HRISCareer\web` |
| Binding | `http`, IP `All Unassigned`, Port `80`, Host name `dqc.hris.vn` |

Nếu dùng HTTPS, chọn `https`, cổng `443`, điền Host name, chọn SSL certificate và tích **Require Server Name Indication**.

### Bước 5: Add Application `api`

Chuột phải site vừa tạo → **Add Application...**:

| Ô | Giá trị |
| --- | --- |
| Alias | `api` (**bắt buộc đúng tên này**, vì trang web gọi API qua `/api`) |
| Application pool | giữ pool của site |
| Physical path | `D:\HRIS\DQC\Source\HRISCareer\api` |

Muốn có thêm link API khác, ví dụ `http://dqc.hris.vn/WebApi`, thì Add Application lần nữa với Alias `WebApi`, Physical path vẫn là thư mục `api`. API tự nhận tên ứng dụng, không cần cấu hình gì thêm.

### Bước 6: Mở trang

- Web: `http://dqc.hris.vn/`
- Admin: `http://dqc.hris.vn/admin` (`admin@careerportal.com` / mật khẩu ở bước 3)
- API: `http://dqc.hris.vn/api/jobs`, và `http://dqc.hris.vn/WebApi/jobs` nếu đã thêm `WebApi`

Lần đầu mở trang có thể mất 10–20 giây, vì API phải tạo bảng và dữ liệu mặc định.

## Khi API khởi động, nó tự làm gì

`api\iis-launch.cjs` chạy mỗi khi IIS khởi động Node:

1. Đọc `..\data\api.env`. Nếu không có thì đọc `api\.env`.
2. Tạo `data\jwt-secret.txt` nếu `JWT_SECRET` chưa được khai báo.
3. Chạy `prisma migrate deploy` để tạo hoặc cập nhật bảng. Muốn tắt bước này, đặt `AUTO_MIGRATE=false` trong `api.env`.
4. Tạo cấu hình site, biểu mẫu ứng tuyển mặc định và admin đầu tiên, nếu những thứ này chưa có. Dữ liệu đã có sẽ không bị sửa.
5. Phục vụ API ở `/api` và ở tên ứng dụng IIS hiện tại (ví dụ `/WebApi`).

Còn `web\iis-launch.mjs`:

- Khi render trang ở server (SSR), nó gọi `/api` qua chính site và binding mà người dùng đang truy cập. Nhờ vậy không phải khai báo domain hay cổng.
- Nó chuyển `/uploads/*` (CV, ảnh tin tức) sang API.
- Upload được lưu ở `data\uploads`.
- Cookie đăng nhập tự bật `Secure` khi truy cập bằng `https`. Qua `http` vẫn đăng nhập và F5 bình thường.

## Quyền thư mục

Pool của site (`IIS AppPool\<tên pool>`) cần quyền **đọc** trên thư mục cài đặt và quyền **ghi** trên `data` (để lưu upload, `jwt-secret.txt`) và trên `web\logs`, `api\logs`. Trên ổ D: mặc định thường đã đủ quyền. Nếu log báo `EPERM` / `Access denied`, cấp quyền như sau (thay tên pool):

```powershell
icacls "D:\HRIS\DQC\Source\HRISCareer" /grant "IIS AppPool\HRISCareer-DQC:(OI)(CI)RX"
icacls "D:\HRIS\DQC\Source\HRISCareer\data" /grant "IIS AppPool\HRISCareer-DQC:(OI)(CI)M"
icacls "D:\HRIS\DQC\Source\HRISCareer\web" /grant "IIS AppPool\HRISCareer-DQC:(OI)(CI)M"
icacls "D:\HRIS\DQC\Source\HRISCareer\api" /grant "IIS AppPool\HRISCareer-DQC:(OI)(CI)M"
```

Nên làm thêm (không bắt buộc): trong **Application Pools** → pool của site → **Advanced Settings**:
- đặt `Start Mode = AlwaysRunning`;
- đặt `Idle Time-out = 0`.

Như vậy Node không bị tắt khi không có người truy cập.

## Cập nhật bản build mới

1. Chép bản mới đè lên `web\` và `api\`. **Giữ nguyên `data\`.**
   Cách an toàn: tạo file `app_offline.htm` trong `web\` và `api\` trước khi chép (IIS dừng Node), chép xong thì xóa file đó.
2. Mở site. API tự chạy migration khi khởi động lại.

## Kiểm tra sự cố

| Hiện tượng | Xem / xử lý |
| --- | --- |
| `500.19` | Chưa cài ASP.NET Core Hosting Bundle, hoặc chưa `iisreset` sau khi cài |
| `502.5` / `500.30` / `500.37` | Node không khởi động được. Xem log mới nhất trong `api\logs\` và `web\logs\` |
| Log: `No settings file` / `DATABASE_URL is missing` | Chưa tạo `data\api.env` (bước 3) |
| Log: `prisma migrate deploy failed` | Sai `DATABASE_URL` hoặc mật khẩu chưa mã hóa ký tự đặc biệt; DB chưa tạo; user không có quyền trên DB |
| Log: `no admin account yet` | Thêm `INITIAL_ADMIN_PASSWORD` vào `api.env`, rồi Recycle pool |
| Trang web lỗi khi tải dữ liệu, còn `/api/jobs` vẫn chạy | Chưa có ứng dụng tên đúng là `api` (bước 5) |
| `node.exe` not found | Cài Node cho mọi user, rồi `iisreset` |

Sau khi sửa `api.env`: vào **Application Pools** → pool của site → **Recycle**.

Script hỗ trợ trong `tools\` (chạy bằng PowerShell Admin), ví dụ đặt lại mật khẩu admin:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\reset-admin-password.ps1
```

## Kiến trúc trên IIS

| IIS | Trỏ tới | Xử lý bởi |
| --- | --- | --- |
| Site | `web\` | Node (TanStack Start SSR) qua ASP.NET Core Module |
| Application `/api` (+ alias tùy chọn) | `api\` | Node (Express) qua ASP.NET Core Module |

ASP.NET Core Module V2 khởi chạy `node.exe`, cấp cổng nội bộ, tự khởi động lại Node khi tiến trình chết và chuyển request tới Node. Không cần URL Rewrite/ARR hay NSSM/PM2. Asset tĩnh `/assets/*` đã được nén sẵn và cache lâu dài.

Các biến môi trường tùy chọn, đặt trong `web.config` (thẻ `environmentVariables`) hoặc trong `data\api.env`:

| Biến | Nơi đặt | Mặc định | Dùng khi |
| --- | --- | --- | --- |
| `API_INTERNAL_URL` | `web\web.config` | site mà người dùng đang truy cập | Server không tự gọi được domain của chính nó, ví dụ site đứng sau proxy/NAT. Đặt thành `http://127.0.0.1:<cổng binding>` |
| `DOTENV_CONFIG_PATH` | `api\web.config` | `..\data\api.env` | Muốn để file cấu hình ở nơi khác |
| `UPLOAD_DIR` | `api.env` | `..\data\uploads` | Muốn để upload ở nơi khác |
| `AUTO_MIGRATE` | `api.env` | `true` | Muốn tự chạy migration bằng tay |

## Cách khác: `deploy.ps1` (release theo thời gian, có rollback)

Dùng cách này khi muốn giữ nhiều release và tự rollback khi lỗi:

- Mỗi release nằm ở `D:\sites\career-portal\releases\<thời-gian>`.
- Dữ liệu cố định nằm ở `<DataDir>`, mặc định là `D:\sites\career-portal\data`.
- `deploy.ps1` không tự seed. Hãy chạy `bun run db:seed:prod` từ máy build, hoặc chạy `tools\seed-initial-data.ps1 -InstallDir <release>` sau khi deploy.

### Deploy bằng `deploy.ps1`

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

