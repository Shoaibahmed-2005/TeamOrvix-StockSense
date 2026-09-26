# STOCKSENSE — PRODUCT SPEC

This is the source of truth for what Stocksense must do and look like. Before building or changing any screen or feature, read the matching section here and implement every field, button, status and rule exactly as written.

Stocksense is a modular Inventory Management System (IMS) that replaces manual registers, Excel sheets and scattered tracking with a centralized, real-time, easy-to-use web app. Target users: **Inventory Managers** (incoming and outgoing stock) and **Warehouse Staff** (transfers, picking, shelving, counting).

## Working rules
- Commit and push to `main` after each feature and at least once every hour, with clear Conventional Commit messages (e.g. `feat(receipts): add receipt form with To Do / Validate workflow`). Update `PROGRESS.md` in every commit.
- Before every commit run `npm run build` and fix all errors. Never push code that fails to build.
- Do not run tests, write new tests or take browser screenshots unless explicitly asked. Manual testing happens at the end.
- Use real, dynamic data from the database everywhere. No hard-coded or static JSON in pages; only the seed script.
- Logo: the Stocksense logo file in the project root (copied to `client/public/logo.png`). Never redraw or replace it. It already contains the "Stocksense" wordmark, so don't repeat the name as text next to it.

## Tech stack
Monorepo with npm workspaces:
- `client/` — React 18 + TypeScript + Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query, react-hook-form + zod, Recharts, lucide-react, socket.io-client.
- `server/` — Node.js + Express + TypeScript, **Prisma ORM with PostgreSQL** (databases `stocksense` and `stocksense_test`), zod validation, bcrypt, JWT in an httpOnly cookie, Socket.IO, Nodemailer (OTP: use SMTP env vars if set, otherwise log the OTP to the server console).
- `shared/` — shared zod schemas and TypeScript types.
- PostgreSQL details: Prisma enums for status/type/role/direction; `Decimal(12,3)` for quantities and `Decimal(12,2)` for costs, converted to numbers in every API response; `Timestamptz` dates stored in UTC, "today" computed in Asia/Kolkata; CHECK constraints so stock quantity and reserved quantity are never negative; atomic reference sequences; `SELECT ... FOR UPDATE` on stock rows during reserve/validate, then a clean 409 "Insufficient stock" if not enough.

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

## UI rules (apply to every page)
- Use the 21st MCP to search for high-quality React + Tailwind + shadcn components for key pieces (sidebar, data table, KPI cards, forms, kanban, stepper), then adapt them to the design tokens above. Never keep a component's own colors or fonts. Search is free; fetch component code only for the most important pieces.
- Use one component library consistently across the app.
- Typography: Inter. Headings semibold (600) or bold (700), never 800/900. Page title 24px, section 18px, body 14px, tables 13–14px with tabular numbers.
- Inputs: 40px height, 8px radius. Leading icons use pl-10 with the icon at left-3, vertically centered — icons must never overlap text or placeholder. Trailing icons (password eye) use pr-10.
- Buttons: 40px height, 8px radius, font-medium, one primary button per screen.
- Cards: 1px border, 12px radius, 20–24px padding; shadow-sm max in light mode, none in dark mode.
- Spacing on an 8px grid; page padding 24px desktop / 16px mobile.
- Logo on colored or gradient backgrounds sits in a white rounded tile (or a white version) so it stays visible; minimum height 32px.
- Auth pages: left brand panel (gradient, logo, one headline, one line of text) + right form panel. No social login buttons.
- Overall feel: premium SaaS dashboard (Linear / Vercel / Stripe level) — calm, generous whitespace, clear hierarchy, no clutter, no emoji, no decorative blobs. Dark mode is designed, not inverted.
