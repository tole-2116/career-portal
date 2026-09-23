# Task-00: Initialize Git & CI/CD Pipeline

## Status: done ✅

## Mô tả
Khởi tạo Git repository, thiết lập quy chuẩn branching, tạo CI/CD pipeline và dọn dẹp file thừa từ scaffolding.

## Công việc đã hoàn thành
- [x] Khởi tạo Git repo với nhánh `main`
- [x] Đổi tên project trong `package.json` thành `career-portal`
- [x] Cấu hình `.gitignore` đầy đủ (node_modules, dist, .output, .vinxi, .env)
- [x] Tạo `.github/workflows/ci.yml` (TypeScript check + Build)
- [x] Xóa thư mục `.lovable/` metadata thừa
- [x] Xóa file tài liệu thừa: `AGENTS.md`, `src/routes/README.md`
- [x] Gỡ bỏ telemetry `lovable-error-reporting` khỏi `__root.tsx`
- [x] Tạo `.skills/` — development guidelines
- [x] Tạo `CLAUDE.md`, `docs/`, `tasks/` — project documentation

## Commits liên quan
- `2418be1` — feat: initial setup career-portal with ci/cd pipeline
- `1dc08f7` — feat(jobs): add salary range filter component
- `089f5b6` — chore: remove .lovable metadata and update project files
- `bdcc110` — chore: clean up unused documentation and telemetry files
- `08d016f` — docs: add project skills and development guidelines
