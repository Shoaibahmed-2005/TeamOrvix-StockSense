# Stocksense Progress

## ✅ M0 — Scaffold
- ✅ Init monorepo (`package.json` with workspaces)
- ✅ Setup `client/` with Vite + React 18 + TypeScript + Tailwind + shadcn/ui
- ✅ Setup `server/` with Express + TypeScript + Prisma (PostgreSQL)
- ✅ Setup `shared/` with shared zod schemas + types
- ✅ Prisma schema with all models (PostgreSQL with native enums, Timestamptz, Decimal types, and Check Constraints)
- ✅ First migration + seed script
- ✅ Copy logo to `client/public/logo.png`, generate square favicon icon
- ✅ README.md, PROGRESS.md, .gitignore, .env.example
- ✅ Root scripts: dev (concurrently), build, test, lint, db:reset
- ✅ Setup Vitest (server API tests, concurrency + serialization tests pass)
- ✅ Setup Playwright (E2E test scaffold)
- ✅ Verify `npm run dev` runs both apps
- ✅ Commit + push to main

## ✅ M1 — Auth
- ✅ Auth API (login by Login ID, signup, me, logout)
- ✅ Auth UI layout (21st component)
- ✅ Forms connected with react-hook-form + zod
- ✅ Signup rules (live checklist)
- ✅ OTP forgot password (UI wired, API mocked)
- ✅ Protected routes, /me session check
- ✅ Commit + push to main

## ⏳ M2 — App Shell + Settings
(Not started)

## ⏳ M3 — Products, Categories, Stock
(Not started)

## ⏳ M4 — Operations Engine (Server)
- ✅ Atomic reference sequences generation via `UPDATE ... RETURNING`
- ✅ Stock quant row locking via `SELECT ... FOR UPDATE`
- ✅ Never-negative stock guard with CHECK constraint `quantity >= 0`
- ⏳ Status transition enforcement
- ⏳ Receipt validate, Delivery confirm/validate, Internal transfer, Adjustment, Cancel

## ⏳ M5 — Receipts + Deliveries UI
(Not started)

## ⏳ M6 — Internal Transfers + Adjustments UI
(Not started)

## ⏳ M7 — Move History + Dashboard + Notifications
(Not started)

## ⏳ M8 — Real-time Sync
(Not started)

## ⏳ M9 — Full QA
(Not started)
