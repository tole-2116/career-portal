# Career Portal — Claude Code Guidelines

## Project Overview

Career Portal là nền tảng tuyển dụng trực tuyến xây dựng trên TanStack Start, hỗ trợ ứng viên tìm việc, nộp hồ sơ và quản trị HR.

## Tech Stack

- **Runtime/PM:** Bun
- **Framework:** TanStack Start + Vite
- **Routing:** TanStack Router (file-based, auto-generated `src/routeTree.gen.ts`)
- **UI:** Tailwind CSS v4 + Shadcn UI (Radix Primitives)
- **Forms:** React Hook Form + Zod
- **i18n:** Song ngữ Tiếng Việt & Tiếng Anh (in-memory stores)

## Key Conventions

- **Commits:** Conventional Commits — `feat(scope): description`
- **Branches:** `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`
- **Language:** TypeScript strict mode, React functional components
- **Paths:** Alias `@/` → `./src/`

## Development Commands

```bash
bun run dev          # Dev server
bun x tsc --noEmit   # TypeScript check
bun run lint         # ESLint
bun run build        # Production build
```

## Architecture Notes

- Routes: `src/routes/` — file-based routing, tree auto-generated
- Stores: `src/lib/` — reactive in-memory stores (jobs, auth, news, inbox, taxonomy, site-config, form-config, language-config)
- Components: `src/components/ui/` (shadcn), `src/components/site/`, `src/components/admin/`, `src/components/home/`
- Data: `src/data/` — mock/seed data

## Rules

1. Always pass `tsc --noEmit` and `build` before committing.
2. Do not commit `.env`, `node_modules/`, `.output/`, `.vinxi/`.
3. Routes must use `createFileRoute` from TanStack Router.
4. i18n content must include both `vi` and `en` keys.
5. Prefer editing existing files over creating new ones.
6. Match existing code style and comment density.
