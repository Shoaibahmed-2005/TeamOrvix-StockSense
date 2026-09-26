# STOCKSENSE — ANTIGRAVITY BUILD PROMPT

> **Before you paste:** create the GitHub repo, clone it, open the folder in Antigravity, and keep the Stocksense logo file (e.g. `stocksenselogo.png`) in the project root folder. Make sure `git push` works from your machine (logged in to GitHub). Then paste **PART 1** into the agent. If the agent session ends or runs out of context, paste **PART 2** to resume.

---

## PART 1 — MAIN PROMPT

You are building **Stocksense**, a complete, production-quality **Inventory Management System (IMS)** for a hackathon. It replaces manual registers, Excel sheets and scattered tracking with a centralized, real-time, easy-to-use web app. Target users: **Inventory Managers** (incoming and outgoing stock) and **Warehouse Staff** (transfers, picking, shelving, counting).

**The Stocksense logo is already present in this project folder** (the stocksenselogo image file: a purple-to-magenta box with a bar chart and the "Stocksense" wordmark). Find it in the folder first. Do not recreate, redraw or replace it. During M0, copy it into `client/public/` as `logo.png`, and generate a square icon version for the favicon and the collapsed sidebar. Use the full logo on the login/signup pages and in the sidebar header. Keep the original file in the repo.

### ⚠️ Hackathon rules you MUST follow (highest priority)

1. **Commit and push to `main` at least once every hour.** Work in the milestones below; each milestone is sized for under one hour. **At the end of every milestone, and also after every meaningful feature inside a milestone**, run the checks, then commit and push:
   ```
   git add -A
   git commit -m "<type>(<scope>): <what was done>"
   git pull --rebase origin main
   git push origin main
   ```
   Never finish a milestone without pushing. If a push fails, fix it (rebase, resolve conflicts) before continuing. Never force-push. Never leave work uncommitted for long.
2. **Commit messages must be clear and explain what was done**, using Conventional Commits, for example:
   - `feat(auth): add signup with login ID, email and password validation`
   - `feat(receipts): add receipt form with Draft > Ready > Done workflow`
   - `fix(stock): prevent negative stock on delivery validation`
   - `test(e2e): add Playwright flow for receipt to stock update`
   - `chore(setup): scaffold client and server with Prisma`
   Prefer several small, focused commits over one large one.
3. The latest working code must always be on `main`. **Never push code that fails to build.** Run the build and tests before each push.
4. Keep a `PROGRESS.md` in the repo root: a checklist of milestones with ✅/⏳, what was done, and what is next. Update it in every commit so any teammate (or a new agent session) can continue.
5. Use real, dynamic data from the database everywhere. No hard-coded or static JSON in pages; only a seed script for demo data.
6. Understand and adapt code; keep it clean, typed and consistent. Do not add trendy libraries unless they add real value.

### Tech stack (local-first, works offline)

Monorepo with npm workspaces:
- `client/` — React 18 + TypeScript + Vite, Tailwind CSS, shadcn/ui, React Router, **TanStack Query**, react-hook-form + zod, Recharts, lucide-react, socket.io-client.
- `server/` — Node.js + Express + TypeScript, **Prisma ORM with SQLite** (file DB, zero setup, works offline; schema kept Postgres-compatible), zod validation, bcrypt, JWT in an httpOnly cookie, Socket.IO, Nodemailer (for OTP: use SMTP env vars if set, otherwise log the OTP to the server console and show it in a dev-only toast).
- `shared/` — shared zod schemas and TypeScript types used by both client and server.
- Testing: **Vitest + Supertest** (API), **Vitest + React Testing Library** (components), **Playwright** (end-to-end).
- Root scripts: `npm run dev` (client + server together via concurrently), `npm run build`, `npm test`, `npm run test:e2e`, `npm run db:reset` (migrate + seed), `npm run lint`.
- `README.md` with setup steps, tech stack, architecture diagram (Mermaid), data model, API list and screenshots section. `.env.example` for all env vars. Proper `.gitignore` (node_modules, .env, *.db, dist, test results).

### Data model (Prisma)

- **User**: id, loginId (unique), email (unique), passwordHash, fullName, role (`MANAGER` | `STAFF`), createdAt.
- **PasswordResetOtp**: id, userId, otpHash, expiresAt (10 min), attempts, used.
- **Warehouse**: id, name, shortCode (unique, uppercase), address.
- **Location**: id, name, shortCode, warehouseId (nullable), type (`INTERNAL` | `VENDOR` | `CUSTOMER` | `ADJUSTMENT`); display full name `<warehouse shortCode>/<location shortCode>` (e.g. `WH/Stock1`). Seed virtual locations "Vendor", "Customer", "Inventory Adjustment".
- **Contact**: id, name, email, phone, address, type (`VENDOR` | `CUSTOMER` | `BOTH`).
- **Category**: id, name (unique).
- **Product**: id, name, sku (unique, e.g. `DESK001`), categoryId, uom (Units, kg, m, L, Box), unitCost, createdAt.
- **ReorderRule**: id, productId, warehouseId, minQty, maxQty.
- **StockQuant**: productId, locationId, quantity, reservedQuantity (unique product+location).
- **Operation**: id, reference (unique), type (`RECEIPT` | `DELIVERY` | `INTERNAL` | `ADJUSTMENT`), status (`DRAFT` | `WAITING` | `READY` | `DONE` | `CANCELLED`), warehouseId, sourceLocationId, destLocationId, contactId, deliveryAddress, operationTypeNote, scheduleDate, responsibleId, doneAt, createdAt.
- **OperationLine**: id, operationId, productId, quantity, countedQuantity (adjustments).
- **StockMove** (append-only Stock Ledger): id, operationId, reference, productId, fromLocationId, toLocationId, quantity, contactId, direction (`IN` | `OUT` | `INTERNAL` | `ADJUSTMENT`), status, date, userId.
- **Sequence**: warehouseId + operationCode (unique), nextNumber.

### Business rules

- **References** are auto-generated in a DB transaction: `<Warehouse shortCode>/<Code>/<4-digit number>`. Codes are `IN` for receipts, `OUT` for deliveries, `INT` for internal transfers and `ADJ` for adjustments (e.g. `WH/IN/0001`, `WH/OUT/0001`). The counter is per warehouse and per type, and never duplicates.
- **On hand** = sum of quantity in INTERNAL locations. **Free to use** = on hand − reserved.
- All stock-changing actions run inside a **single Prisma `$transaction`** so stock and the ledger never go out of sync:
  - **Receipt validate** → destination +qty, one `IN` StockMove per line.
  - **Delivery confirm** → if every line has enough free stock, set status READY and reserve the stock; otherwise set WAITING. **Validate** → source −qty, release the reservation, one `OUT` move per line.
  - **Internal transfer validate** → source −qty, destination +qty (total unchanged), `INTERNAL` moves.
  - **Adjustment apply** → set quantity to the counted value; log the difference as a move to/from "Inventory Adjustment".
  - **Cancel** → release reservations; not allowed on DONE.
- **Stock can never go negative**; reject with a clear error.
- Low stock: free to use ≤ reorder minQty. Out of stock: on hand = 0.
- DONE and CANCELLED documents are read-only.
- Status transitions are enforced on the server (e.g. you cannot validate a DRAFT receipt).

### Real-time sync between pages (important)

Any change made on one page must show up on every other page immediately, both in the same tab and for other users:
- Every mutation uses TanStack Query and **invalidates all affected query keys**. For example, validating a receipt invalidates receipts, the operation detail, stock, products, move-history, dashboard and notifications.
- Define all query keys in one `queryKeys.ts` file and build a helper `invalidateInventory()` so no page is missed.
- Server emits Socket.IO events (`operation:changed`, `stock:changed`, `master:changed`) after each committed transaction. The client listens and invalidates the matching queries, so a second browser window updates without a refresh.
- Use optimistic UI only where safe (not for stock validation).

### API

REST under `/api`, all protected except auth, all inputs validated with shared zod schemas, consistent error shape `{ error: { code, message, fields? } }`:
- Auth:
  - `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
  - `POST /auth/forgot-password` (send OTP), `POST /auth/verify-otp`, `POST /auth/reset-password`
- Dashboard: `GET /dashboard?type=&status=&warehouseId=&locationId=&categoryId=`
- Master data (CRUD): `/warehouses`, `/locations`, `/contacts`, `/categories`, `/products` (search by name/SKU), `/products/:id/stock`, `/reorder-rules`
- Stock: `GET /stock?locationId=&search=`, `POST /stock/update` (creates an adjustment behind the scenes)
- Operations:
  - `GET /operations?type=&status=&search=&warehouseId=&from=&to=`, `POST /operations`, `GET/PATCH /operations/:id`
  - Actions: `POST /operations/:id/confirm | check-availability | validate | cancel`
  - `GET /operations/:id/print`
- Moves: `GET /moves?search=&productId=&locationId=&direction=&from=&to=`, `GET /moves/export.csv`
- Notifications: `GET /notifications` (low stock and late operations)
- Profile: `GET/PATCH /me`, `POST /me/password`

### Screens

**Layout** — collapsible **left sidebar** with the logo at the top:
- Dashboard
- Operations ▸ Receipts, Deliveries, Internal Transfers, Adjustments
- Products ▸ Products, Stock, Categories
- Move History
- Settings ▸ Warehouses, Locations, Contacts
- Bottom: avatar with initials → My Profile, Theme (Light / Dark / System), Logout

Top header: page title/breadcrumb, global search (products by name/SKU, operations by reference/contact), notification bell, theme toggle. Fully responsive: the sidebar becomes a drawer on mobile and tables become stacked cards. Every protected route redirects to `/login` when signed out; `/login` redirects to the dashboard when signed in.

**Login** — logo; Login ID, Password; "Sign In"; links "Forgot Password?" and "Sign Up".
- Wrong credentials show exactly **"Invalid Login Id or Password"**.
- Success goes to the Dashboard.

**Sign Up** — logo; Login ID, Email, Password, Re-enter Password; "Sign Up". Validated on both client and server:
- Login ID is unique and **6–12 characters**.
- Email is valid and not a duplicate.
- Password is **more than 8 characters** with at least one lowercase letter, one uppercase letter and one special character. Show a live rule checklist.
- Passwords must match.

**Forgot Password** — email → 6-digit OTP (hashed, expires in 10 min, max 5 attempts) → new password with the same rules → back to login.

**Dashboard** — snapshot of operations.
- KPI cards: Total Products in Stock, Low Stock, Out of Stock, Pending Receipts, Pending Deliveries, Internal Transfers Scheduled. Each is clickable and opens the filtered list.
- **Receipt card**: button "**N to Receive**" plus "X Late" and "Y Operations".
- **Delivery card**: button "**N to Deliver**" plus "X Late", "Y Waiting" and "Z Operations".
- Definitions: Late = schedule date < today and not done or cancelled. Waiting = status WAITING. Operations = pending with schedule date > today. Each stat links to the filtered list.
- Dynamic filters: document type (Receipts / Delivery / Internal / Adjustments), status (Draft, Waiting, Ready, Done, Cancelled), warehouse/location, product category.
- Charts: stock in vs out over the last 30 days (line), stock value by category (bar), low-stock list with a "Create Receipt" shortcut.

**Operation list pages** (Receipts, Deliveries, Internal Transfers, Adjustments)
- Header: **New** button, title, search (reference and contact), **List / Kanban** toggle. **Default view is List.**
- Filters: status, warehouse, date range.
- List columns: Reference, From, To, Contact, Schedule Date, Status badge. Late dates show in danger color.
- Kanban: columns by status; cards show reference, contact, date and line count.
- Clicking a row opens the form.

**Receipt form**
- Action bar: **"To Do"** when DRAFT (→ READY), **"Validate"** when READY (→ DONE, stock increases), **Print** (enabled only when DONE), **Cancel**.
- Stepper: **Draft › Ready › Done**.
- Fields: Reference (auto, read-only), **Receive From** (vendor combobox with "create new"), **Schedule Date**, **Responsible** (auto-filled with the logged-in user), destination location.
- Products table: product shown as `[DESK001] Desk`, Quantity, delete button, and an "Add a product" row.

**Delivery form**
- Same layout. Stepper: **Draft › Waiting › Ready › Done**.
- Fields: Reference, **Delivery Address**, **Schedule Date**, **Responsible**, **Operation Type** dropdown, customer, source location.
- Products table: Product, Quantity, Available. **If stock is insufficient, show a toast and mark that line red.**
- Waiting deliveries get a "Check Availability" button. Optional Pick and Pack checkboxes before Validate.

**Internal Transfer form** — From and To location (can be across warehouses); Draft › Ready › Done.

**Adjustment form** — choose a location (optionally filter by product/category) → table of Recorded Qty, **Counted Qty** (editable) and Difference (green for +, red for −) → "Apply".

**Print** — printable receipt/delivery slip (logo, reference, contact, date, lines, responsible, signature line) via a print stylesheet. Allows saving as PDF from the browser.

**Move History** — New, search, List/Kanban (default List). Filters: date, product, location, direction.
- Columns: Reference, Date, Contact, From, To, Product, Quantity, Status.
- **One row per product** when a reference has several products.
- **IN rows green, OUT rows red**, internal moves info color, adjustments warning color. Quantity shown as +N / −N.
- CSV export.

**Products** — list: Name, SKU, Category, UoM, Unit Cost, On Hand, Free to Use, stock badge; search by name or SKU; filters.
- Form: Name, SKU, Category, UoM, Unit Cost, optional **Initial Stock** + location (creates an adjustment), reorder rules.
- Detail page: stock per location and the product's move history.

**Stock** — Product, Per Unit Cost (₹), On Hand, Free to Use; location filter; total stock value; search. **Inline edit of on hand** creates a logged adjustment.

**Settings**
- Warehouses: Name, Short Code (unique, uppercase, 2–5 characters), Address. Creating a warehouse auto-creates a "Stock" location.
- Locations: Name, Short Code, Warehouse select. Holds rooms, racks and shelves.
- Contacts: CRUD.

**My Profile** — name, login ID (read-only), email, role, change password, theme preference.

### Validation and UX

- zod on client and server; database constraints for uniqueness.
- Quantities must be > 0 (integers for Units). Schedule date is required. At least one line before confirming.
- Inline field errors, toasts, disabled buttons while saving, confirm dialogs for Validate and Cancel.
- Empty states with an action, skeleton loaders, 404 page, error boundary.
- Currency ₹ with Indian number formatting; dates DD/MM/YYYY.
- Keyboard accessible with visible focus rings; aria-labels on icon buttons.

### Design system

Clean premium SaaS look.
- Font: **Inter**, with tabular numbers in tables.
- 8px spacing grid, 12px card radius, 1px borders, soft shadows in light mode only.
- **Light, Dark and System** themes through CSS variables mapped to Tailwind/shadcn tokens, with no flash on load. Both themes must feel like the same product.
- Purple is the primary color. Magenta is a sparing accent (active nav indicator, one key KPI, CTA highlight), never large solid areas.
- The purple→magenta gradient is used only on the logo area and at most one hero KPI. Never pure black in dark mode.

**Light mode**
- Background `#FAF8FC`; sidebar and cards `#FFFFFF`; hover `#F6F0F7`
- Primary `#7A0B7E`, hover `#5E0861`
- Accent `#F00072` (icons, indicators, large text); accent for text and hover `#D90065`
- Text `#241525` / secondary `#756A78` / muted `#9A8F9D`
- Border `#E9E1EA`; input background `#FFFFFF`, input border `#DCD1DE`
- Status fills: success `#16A36A`, warning `#F59E0B`, danger `#E5484D`, info `#7C5CFC`
- Status text: success `#0F7A4F`, warning `#B45309`, danger `#C5282F`, info `#5B3FD9`
- Badges: 12% tint background with the status text color

**Dark mode**
- Background `#110C13`; sidebar `#171019`; card `#1D141F`; hover `#261A29`
- Primary `#B83DB8`, hover `#D05ACF`
- Accent `#FF4A9A`, hover `#FF6EAD`
- Text `#F8F2F8` / secondary `#B9ACBB` / muted `#887B8B`
- Border `#352738`; input background `#1D141F`, input border `#49364B`
- Status: success `#35C98A`, warning `#FFB52E`, danger `#FF6268`, info `#9B83FF`
- Badges: 16% tint background with the full status color as text
- Never use `#7A0B7E` for text or buttons in dark mode

**Charts** (same meaning in both modes)
- Light: primary `#7A0B7E`, secondary `#F00072`, purple `#A855F7`, magenta `#C026D3`, positive `#16A36A`, warning `#F59E0B`, negative `#E5484D`
- Dark: primary `#C653C6`, secondary `#FF4A9A`, purple `#B980FF`, magenta `#E05AD6`, positive `#35C98A`, warning `#FFB52E`, negative `#FF6268`
- Stock In is always green, Stock Out always red, stock value always primary purple.

### Seed data (`npm run db:reset`)

- Demo user `admin01` / `Admin@1234`.
- **Main Warehouse** (WH, Chennai) with locations Stock1, Stock2, Rack A, Rack B and Production Floor. **Warehouse 2** (WH2).
- Contacts: Azure Interior (both), Steel Corp (vendor), Gemini Furniture (customer).
- Categories: Furniture, Raw Material, Office Supplies.
- Products: `[DESK001] Desk` (₹3000, 50 on hand), `[TABLE001] Table` (₹3000, 50), `[CHAIR001] Chair` (₹1200), `[STEEL001] Steel Rods` (kg).
- Receipts and deliveries in every status, including one late and one waiting, so the dashboard shows real numbers.

### Milestones (commit + push at the end of each, and more often inside)

Before coding, create an implementation plan and task list from these milestones and show it. Then execute them in order without waiting for approval between milestones, unless something is blocked.

| # | Milestone | Done when |
|---|---|---|
| M0 | Scaffold monorepo, Tailwind + shadcn, theme tokens (light/dark), Prisma schema + first migration, seed, Express skeleton, README, PROGRESS.md, `.gitignore`, `.env.example` | `npm run dev` runs both apps; first push to main |
| M1 | Auth: signup, login, logout, `/me`, protected routes, OTP forgot/reset password, auth pages UI | Auth API tests + E2E pass |
| M2 | App shell: sidebar, header, theme toggle, profile menu, responsive drawer, 404, error boundary; Settings: Warehouses, Locations, Contacts CRUD | Every nav link opens the right page |
| M3 | Products, Categories, Reorder rules, Stock page with inline update, product detail with stock per location | CRUD + stock update tests pass |
| M4 | Operations engine on the server: sequences, status transitions, confirm/validate/cancel transactions, reservations, stock moves | Stock-engine unit tests pass |
| M5 | Receipts and Deliveries: list (List/Kanban, search, filters) + forms + print | Receipt → stock increase and delivery → stock decrease E2E pass |
| M6 | Internal Transfers + Adjustments UI | Transfer and adjustment E2E pass |
| M7 | Move History (colors, one row per product, filters, CSV) + Dashboard (KPIs, cards, filters, charts) + notifications | Dashboard numbers match DB after every action |
| M8 | Real-time sync: central query keys, invalidation on every mutation, Socket.IO events | Cross-page and two-window sync tests pass |
| M9 | Full QA pass (below), responsive + accessibility + dark mode polish, README screenshots | All tests green; final push |

### Testing requirements (do this during the build, not only at the end)

After finishing each page or feature, before committing:

1. **Automated tests**
   - API (Supertest): every endpoint's happy path plus validation errors, auth protection (401), illegal status transitions and negative-stock rejection.
   - Stock engine unit tests. Run the PDF scenario and assert each step: receive 100 kg Steel Rods (+100) → internal transfer Stock1 → Production Floor (total unchanged, locations updated) → deliver 20 (−20) → adjustment for 3 damaged (−3) → final 77, with 4 ledger entries.
   - Component tests (RTL) for forms: field validation messages, disabled submit while saving, the status-dependent button ("To Do" vs "Validate", Print disabled until DONE).
   - **Playwright E2E** covering:
     - signup (each rule), login error message, forgot password with OTP, logout, protected-route redirect
     - **every sidebar link and every button** on each page (New, Search, List/Kanban toggle, To Do, Validate, Print, Cancel, Add a product, delete line, Check Availability, Apply, Export CSV, theme toggle, profile menu) does what it should and causes no console errors
     - full receipt flow: create → To Do → Validate → Stock page shows +qty, Move History shows a green row, dashboard "to receive" count decreases
     - delivery with insufficient stock: red line + toast + WAITING; then receive stock → Check Availability → READY → Validate → stock decreases, red row in Move History
     - internal transfer and adjustment flows
     - **cross-page sync**: change data on one page and navigate to Dashboard, Stock, Products and Move History; the new values appear without a manual refresh
     - **two-browser-context sync**: validate in context A; context B's open Dashboard/Stock updates within a few seconds via Socket.IO
     - responsive checks at 375px and 1440px, in light and dark mode
2. **Manual check in the browser**: use your browser tool to open the running app and click through the page you just built. Verify layout, navigation, every button, empty states and dark mode. Fix anything broken before committing.
3. Run `npm run lint && npm run build && npm test` (and `npm run test:e2e` from M5 onwards). Only commit and push when green. If a test fails, fix the code (not the test), then commit with `fix(...)`.
4. Record what you tested in `PROGRESS.md`.

At the end, give me a short summary: what was built, test results, how to run the app, and the demo login.

---

## PART 2 — RESUME PROMPT (use if the session ends or context runs out)

> Continue building Stocksense. Read `PROGRESS.md`, `README.md` and the git log to see what is done. Continue from the next unfinished milestone, following the same rules: small commits with Conventional Commit messages, run lint + build + tests before every push, `git pull --rebase origin main` then `git push origin main` at least every hour and at the end of each milestone, update `PROGRESS.md` in every commit, and test every new page's buttons, navigation and cross-page updates (automated + in the browser) before moving on.

---

## PART 3 — FINAL QA PROMPT (use near the end)

> Do a full QA pass of Stocksense as a strict tester. Run all unit, API and Playwright tests. Then use the browser to click every sidebar link and every button on every page in both light and dark mode at mobile and desktop widths. Verify: auth rules and error messages; Receipt Draft › Ready › Done; Delivery Draft › Waiting › Ready › Done with a red line when out of stock; references auto-increment per warehouse; stock never goes negative; Move History colors and one row per product; dashboard Late/Waiting/Operations counts match the data; changes on one page appear immediately on Dashboard, Stock, Products and Move History, and in a second browser window. List every bug found, fix each one with its own `fix(...)` commit, re-run the tests, update `PROGRESS.md` and push to main.
