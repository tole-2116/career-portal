# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Career Portal is a bilingual (Vietnamese/English) recruiting platform built as a Bun/Turbo monorepo: public job site + HR admin area in `apps/web`, Express API in `apps/api`, and shared types, Prisma database access, and TypeScript config in `packages/`. Bun `1.3.13` is the runtime and package manager (see `packageManager` in `package.json`).

## Commands

Run from the repository root unless noted:

```bash
bun install
bun run dev                 # Start workspace dev tasks via Turbo
bun run build               # turbo build, then stage the IIS release in deploy/career-portal
bun run lint                # Lint workspaces that define lint scripts (only web)
bun x tsc --noEmit          # Root TypeScript check (used by CI)
```

Local development normally uses two terminals:

```bash
bun --filter @career-portal/api dev    # http://localhost:5000; runs db:migrate:dev first, then bun --watch
bun --filter @career-portal/web dev    # http://localhost:5173; proxies /api and /uploads to :5000
```

Other web commands: `bun --filter @career-portal/web lint`, `... build`, `... format` (Prettier).

Database (Prisma 5 + PostgreSQL; `docker-compose.yml` provides a local Postgres 16):

```bash
bun run db:migrate:dev
bun run db:migrate:prod     # prisma migrate deploy
bun run db:seed:dev         # sample data; safe to re-run to refresh
bun run db:seed:prod        # only platform admin + default site config; set INITIAL_ADMIN_PASSWORD first
bun run db:setup:dev        # migrate + seed
bun --filter @career-portal/database db:studio
```

API dev runs migrations on startup but never seeds; seed a fresh dev DB once manually. The current migration is a single baseline for new databases — databases that recorded the older migrations will not apply it automatically.

Environment: `packages/database/.env` needs `DATABASE_URL`; `apps/api/.env` needs `PORT`, `DATABASE_URL`, `CLIENT_URL`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_DAYS` (see README for examples).

There is no test runner. CI (`.github/workflows/ci.yml`) runs `bun install --frozen-lockfile`, `bun x tsc --noEmit`, and `bun run build`; it does not run lint. `scripts/browser-jobs-smoke.ts` is an ad-hoc Playwright smoke check against a running web app (`BASE_URL`, default `http://localhost:5173`).

## Architecture

- **Web (`apps/web`)**: TanStack Start + Router on Vite 8, React 19, Tailwind CSS v4, Shadcn/Radix UI. The `@/*` alias resolves to `apps/web/src/*`.
  - `vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which already wires TanStack Start, React, Tailwind, tsconfig paths, Nitro, and the `@` alias — do not add those plugins manually (duplicates break the app). Extra Vite config goes under `vite: {...}`. The SSR server entry is redirected to `src/server.ts` (an SSR error wrapper).
  - File-based routes live in `src/routes/` (`createFileRoute`, dot-separated nesting such as `jobs.$jobId.apply.tsx`, admin pages as `admin.*.tsx`). `__root.tsx` is the root document; `router.tsx` configures the router. `src/routeTree.gen.ts` is generated — edit route files, never the tree.
  - Data access is mixed. API-backed features call the Express API through `src/services/*.api.ts` and `src/lib/api/*`, all built on `src/lib/api/request.ts` (bearer token from `auth-store`, single-flight access-token refresh, `ApiError` with `code`/`field`). Other state lives in client-side stores/providers in `src/lib/` (jobs, auth, news, inbox, taxonomy, site/form/language config), some seeded from `src/data/` mock content. Check the specific feature before assuming whether it persists to the database.
  - i18n: every user-visible string must support both `vi` and `en`; read the current language from `LanguageConfigProvider` rather than hardcoding text. Localized content/config must keep both variants.
- **API (`apps/api`)**: Express 4 with a `routes/ → controllers/ → services/` layering (admin-* modules for the admin area, public-jobs/news/auth for the site). `middleware/auth.ts` handles JWT auth, `middleware/upload.ts` handles multer uploads served from `/uploads`, `config/env.ts` reads env, and `defaults/` holds default site/form configuration.
- **Packages**: `packages/database` owns the Prisma schema, migrations, seed (`prisma/seed.ts`), and exports the Prisma client from `src/index.ts` (consumed as TS source). `packages/types` holds domain types/validation schemas shared by web and API. `packages/typescript-config` holds shared tsconfigs.

## Deployment

The web builds with Nitro's `node-server` preset (`apps/web/vite.config.ts`) and the target host is IIS. `bun run build` ends with `scripts/deploy/stage.ts`, which writes a self-contained release to `deploy/career-portal/` (`web/`, `api/`, `data/api.env.example`, `tools/`, `deploy.ps1`, `setup-iis.ps1`, `README.md`). The standard install needs no scripts: copy the folder, create `data/api.env` (only `DATABASE_URL` required; `INITIAL_ADMIN_PASSWORD` for the first admin), then in IIS Manager Add Website -> `web` and Add Application `api` -> `api`. `api/iis-launch.cjs` loads `../data/api.env`, generates `data/jwt-secret.txt`, runs the bundled Prisma CLI `migrate deploy` and serves the IIS application path (e.g. `/WebApi`) as `/api`; the API creates default site/form config and the first admin on an empty DB (`apps/api/src/bootstrap.ts`). `web/iis-launch.mjs` derives the SSR API origin from each request (Host + X-Forwarded-Proto) over loopback and forwards `/uploads/*` to `/api/uploads/*`. The API bundle defines `process.env.NODE_ENV` as production (Bun would otherwise inline the build machine value). Note: in PowerShell 5.1, `$PSScriptRoot` is empty inside `param()` defaults of `[CmdletBinding()]` scripts, so resolve it in the body. On the server, `deploy.ps1` is the one-command deploy (self-elevates, copies to a versioned release folder under `D:\sites\career-portal\releases` with data in `D:\sites\career-portal\data` by default, creates `api.env`, pg_dump backup, `prisma migrate deploy`, runs `setup-iis.ps1`, health check with automatic IIS rollback, prunes old releases; `-TargetDir <folder>` instead deploys into one fixed folder via app_offline.htm + robocopy /MIR, without rollback); `bun run deploy:iis` does build + deploy when the build machine is the IIS host. The API is bundled by Bun into one CommonJS file with only `@prisma/client` and the generated `.prisma/client` (native Windows engine) kept external. IIS hosts both Node processes through the ASP.NET Core Module V2 (out-of-process, no URL Rewrite/ARR): site root → `web/`, application `/api` → `api/`, and virtual directory `/uploads` → a persistent data folder served as static files. Templates live in `scripts/deploy/iis/` (`web.config`, `iis-launch.*` launchers that map `ASPNETCORE_PORT` to `PORT`, `deploy.ps1`, `setup-iis.ps1`, and the release `README.md` deployment guide in Vietnamese). Runtime env added for hosting: API `HOST`, `UPLOAD_DIR`, `DOTENV_CONFIG_PATH`; web `API_INTERNAL_URL`, the base URL SSR loaders use for `/api` calls because relative URLs fail in Node. `deploy/` is build output and must not be committed.

## Repository conventions

- Task files under `tasks/` include a Definition of Done; when changing a task's status, move the file between `backlog/`, `in-progress/`, and `done/`. Run the typecheck and build before committing task work.
- Branches: `<type>/<kebab-description>` from `main` (`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`). Commits: Conventional Commits, `<type>(<scope>): <summary>`.
- Code style (`docs/CONVENTIONS.md`): avoid `any`, function components + hooks, `@/` imports over relative `../`, Tailwind over custom CSS, Shadcn/CVA `variant` pattern, extract code repeated three times.
- Do not commit generated output or dependencies: `node_modules/`, `.output/`, `.vinxi/`, `deploy/`.
- Further reading: `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`, and `.skills/` (code style, git workflow, testing/build notes).
