# Stocksense Walkthrough

## 1. HOW TO RUN

### Prerequisites
- Node.js v18 or higher (`node -v` to check)
- PostgreSQL v14 or higher (`psql --version` to check)

### Setup the Databases
Run the following in `psql` (or any PostgreSQL client):
```sql
CREATE DATABASE stocksense;
CREATE DATABASE stocksense_test;
```

### Environment Variables
In the `server/` directory, create a `.env` file (copy `.env.example` as a start):
```env
PORT=3001
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/stocksense?schema=public"
TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/stocksense_test?schema=public"
JWT_SECRET="change-me-to-a-long-random-string"
CLIENT_URL="http://localhost:5173"
```
Replace `YOUR_PASSWORD` with your local Postgres password, and adjust username/port if needed.

### Exact Commands (run from project root in order)
```bash
# 1. Install all dependencies
npm install

# 2. Apply database migrations
cd server
npx prisma migrate dev

# 3. Reset and seed the database with demo data
npm run db:reset --workspace=server

# 4. Start both client and server in development mode
cd ..
npm run dev
```

### URLs to Open
| Service | URL |
|---------|-----|
| Web App (Client) | http://localhost:5173 |
| API Server | http://localhost:3001 |

### Demo Login
| Field | Value |
|-------|-------|
| Login ID | `admin01` |
| Password | `Admin@1234` |

---

## 2. PAGE-BY-PAGE GUIDE

### Dashboard — `/`
The real-time snapshot of all inventory operations.

**Receipt Card:**
- **"N to Receive" button** — shows count of READY receipts; clicks through to `/receipts?status=READY`
- **"X Late"** — receipts whose schedule date is past today (IST) and not DONE/CANCELLED; links to `/receipts?late=1`
- **"Y Operations"** — pending receipts with schedule date in the future; links to `/receipts?status=DRAFT`

**Delivery Card:**
- **"N to Deliver" button** — count of READY deliveries; links to `/deliveries?status=READY`
- **"X Late"** — deliveries past due; links to `/deliveries?late=1`
- **"Y Waiting"** — deliveries in WAITING status (insufficient stock); links to `/deliveries?status=WAITING`
- **"Z Operations"** — future-dated pending deliveries; links to `/deliveries?status=DRAFT`

**Internal Transfers Card:** count of non-DONE/CANCELLED internal transfers; links to `/internal`

**KPI Cards:**
- Total Products (links to `/products`)
- Low Stock — products below reorder min qty (links to `/stock`)
- Out of Stock — products with 0 on hand (links to `/stock`)

**Operations chart:** Bar chart of operations by type over the last 30 days.

**Recent Stock Moves:** last 8 moves with product name, reference, date, and +/- quantity badge.

**Low Stock Alerts panel:** lists up to 8 low-stock products with a "Create Receipt" shortcut button.

**Seed data to expect:**
- Receipt card: "2 to Receive" (WH/IN/0003 is READY), "1 Late" (WH/IN/0004), "1 Operations" (WH/IN/0002 is future-dated DRAFT)
- Delivery card: "0 to Deliver", "0 Late", "1 Waiting" (WH/OUT/0002)
- Low Stock: Chair (3 on hand, min 5)
- Out of Stock: Steel Rods (0 on hand)

---

### Notification Bell (Header)
Click the bell icon in the top-right header.
- Polls every 10 seconds for low-stock products, pending receipts and pending deliveries.
- Shows a red badge dot when alerts exist.
- Each notification row is clickable and navigates to the relevant list.

**Seed data to expect:** alerts for Low Stock (Chair), Pending Receipts.

---

### Receipts — `/receipts`
**Controls:**
- **New Receipt** button → `/receipts/new`
- Search bar (matches reference or contact name)
- Status filter, Warehouse filter, Date range filter
- **List / Kanban** toggle (default List)
- Click any row → opens `/receipts/:id`

**List columns:** Reference, From, To, Contact, Schedule Date, Status badge (late dates in red)

**Seed data to expect:**
| Reference | Status | Contact | Notes |
|-----------|--------|---------|-------|
| WH/IN/0001 | DONE | Azure Interior | 50 Desks + 50 Tables received |
| WH/IN/0002 | DRAFT | Steel Corp | 100 Steel Rods, future date |
| WH/IN/0003 | READY | Azure Interior | 20 Chairs, today |
| WH/IN/0004 | DRAFT | Steel Corp | 50 Steel Rods, **late** (3 days ago) |

---

### Receipt Form — `/receipts/new` or `/receipts/:id`
**Action bar buttons:**
- **"Mark as To Do"** (DRAFT only) → moves to READY
- **"Validate"** (READY only) → moves to DONE, increases destination stock, creates stock moves
- **"Cancel"** (DRAFT or READY only) → marks CANCELLED
- **"Print"** (DONE only) → triggers browser print of the proper A4 slip

**Status stepper:** Draft › Ready › Done

**Fields:**
- Reference (auto-generated, read-only for existing)
- Receive From (Vendor) — select from vendor/both contacts
- Destination Location — internal locations
- Schedule Date (datetime picker)
- Responsible — auto-filled with logged-in user's name (always read-only)

**Products table:** `[SKU] Name` format in selector, Quantity column, Done column (READY), delete button (DRAFT only), "Add a product" button at bottom.

---

### Deliveries — `/deliveries`
Same layout as Receipts. Lists delivery operations.

**Seed data to expect:**
| Reference | Status | Contact | Notes |
|-----------|--------|---------|-------|
| WH/OUT/0001 | DONE | Gemini Furniture | 10 Desks delivered |
| WH/OUT/0002 | WAITING | Gemini Furniture | 10 Chairs, insufficient stock |

---

### Delivery Form — `/deliveries/new` or `/deliveries/:id`
**Action bar buttons:**
- **"Mark as To Do"** (DRAFT) → tries to reserve stock; if insufficient, goes to WAITING with a toast error
- **"Check Availability"** (WAITING) → re-checks stock; moves to READY if stock available
- **"Validate"** (READY) → ships goods, decrements stock
- **"Cancel"** / **"Print"** (DONE)

**Status stepper:** Draft › Waiting › Ready › Done

**Fields:** Reference, Delivery Address, Schedule Date, Responsible (auto-filled), Operation Type, Customer (Contact), Source Location.

**Products table:** Product, Quantity, Available columns. Lines with insufficient stock show red background and a toast notification on To Do.

---

### Internal Transfers — `/internal`
**Controls:** Same as Receipts list. "New Transfer" → `/internal/new`.

**Seed data to expect:**
| Reference | Status | Notes |
|-----------|--------|-------|
| WH/INT/0001 | DRAFT | Table × 5, Stock1 → Rack B |

---

### Internal Transfer Form — `/internal/new` or `/internal/:id`
**Action bar:** "Mark as To Do" → READY, "Validate" → DONE (moves stock between locations, total unchanged), "Cancel", "Print" (DONE only).

**Stepper:** Draft › Ready › Done

**Fields:** Source Location, Destination Location, Schedule Date, Responsible, Products table.

---

### Adjustments — `/adjustments`
**Controls:** Same as Receipts list. "New Adjustment" → `/adjustments/new`.

**Seed data:** Empty initially (adjustments are created inline by stock edits or new products with initial stock).

---

### Adjustment Form — `/adjustments/new` or `/adjustments/:id`
**Action bar:** "Mark as To Do" → READY, "Validate / Apply" → DONE (sets stock to counted qty, creates ADJUSTMENT move), "Cancel".

**Stepper:** Draft › Ready › Done

**Fields:** Adjustment Location, Schedule Date, Responsible, Products table with Recorded Qty, Counted Qty (editable) and Difference (green +, red −).

---

### Move History — `/history`
**Controls:**
- Search bar (reference, product, contact)
- Direction filter (ALL / IN / OUT / INTERNAL / ADJUSTMENT)
- List / Kanban toggle (default List)
- **Export CSV** button — downloads filtered view as CSV

**Columns:** Reference, Date, Contact, From, To, Product, Quantity (+N / −N), Direction

**Row colours:**
- IN rows → green background
- OUT rows → red background
- INTERNAL rows → violet background
- ADJUSTMENT rows → amber background

One row per product per operation line.

**Seed data to expect:** 3 rows from done operations (Desk IN ×50, Table IN ×50 from WH/IN/0001; Desk OUT ×10 from WH/OUT/0001).

---

### Products — `/products`
**Controls:**
- Search bar (name or SKU)
- "Add Product" button → opens modal
- Edit (pencil) icon per row → edit modal

**Table columns:** Product, SKU, Category, UoM, Unit Cost, On Hand, Free to Use

**Add Product modal:** Name, SKU, Category, UoM, Unit Cost, Optional "Initial Stock" qty + location (creates an ADJUSTMENT automatically on save).

**Edit Product modal:** Same fields; shows "Stock Details" breakdown per location for existing products.

**Seed data to expect:**
| Product | SKU | Category | Unit Cost | On Hand |
|---------|-----|----------|-----------|---------|
| Desk | DESK001 | Furniture | ₹3,000 | 50 |
| Table | TABLE001 | Furniture | ₹3,000 | 50 |
| Chair | CHAIR001 | Furniture | ₹1,200 | 3 |
| Steel Rods | STEEL001 | Raw Material | ₹85 | 0 |

---

### Stock Levels — `/stock`
**Controls:**
- Search bar (product or location)
- Location filter dropdown (internal locations)
- Total Stock Value shown top-right in ₹ (Indian format)

**Columns:** Product, Location, Per Unit Cost (₹), On Hand, Free to Use

**Inline edit:** Hover "On Hand" to reveal pencil icon; enter new quantity and save (creates an ADJUSTMENT operation automatically).

**Free to Use** colour: green (available), amber (< 5), red (0).

**Seed data to expect (after seed):** Desk 50, Table 50, Chair 3, Steel Rods 0 — all in Stock1/WH.

---

### Categories — `/categories`
**Controls:** "Add Category" button, list with edit/delete.

**Seed data:** Furniture, Raw Material, Office Supplies.

---

### Settings: Warehouses — `/settings/warehouses`
**Controls:** Form for Name, Short Code (uppercase, 2–5 chars), Address. CRUD table.

**Seed data:**
| Name | Code | Address |
|------|------|---------|
| Main Warehouse | WH | Chennai, Tamil Nadu |
| Warehouse 2 | WH2 | Bengaluru, Karnataka |

---

### Settings: Locations — `/settings/locations`
**Controls:** Form for Name, Short Code, Type, Warehouse. CRUD table.

**Seed data:**

| Name | Type | Warehouse |
|------|------|-----------|
| Stock1 | INTERNAL | WH |
| Stock2 | INTERNAL | WH |
| Rack A | INTERNAL | WH |
| Rack B | INTERNAL | WH |
| Production Floor | INTERNAL | WH |
| Stock | INTERNAL | WH2 |
| Vendor | VENDOR | — (virtual) |
| Customer | CUSTOMER | — (virtual) |
| Inventory Adjustment | ADJUSTMENT | — (virtual) |

---

### Settings: Contacts — `/settings/contacts`
**Controls:** Form for Name, Email, Phone, Address, Type (VENDOR / CUSTOMER / BOTH). CRUD table.

**Seed data:**
| Name | Type |
|------|------|
| Azure Interior | BOTH |
| Steel Corp | VENDOR |
| Gemini Furniture | CUSTOMER |

---

### My Profile — `/settings/profile`
**Controls:** Edit Full Name and Email; Change Password form; theme preference selector; Logout button.

---

## 3. TEST SCENARIOS (exact steps and expected results)

### a. Login with wrong password
1. Go to http://localhost:5173/login
2. Enter Login ID: `admin01`, Password: `wrongpassword`
3. Click **Sign In**
4. **Expected:** Inline error: `"Invalid Login Id or Password"` (exact string, no period)

---

### b. Sign up with a weak password
1. Go to http://localhost:5173/signup
2. Fill Full Name, Login ID, Email. Enter Password: `password`
3. **Expected live checklist:**
   - ✅ More than 8 characters (passes — 8 chars is the boundary; "password" is 8 chars so ❌ actually)
   - ❌ One uppercase letter (fails)
   - ❌ One special character (fails)
   - ✅ One lowercase letter (passes)
4. Submit is blocked until all pass.

---

### c. Receipt Flow — Desk × 10
1. Go to `/receipts/new`
2. Select "Receive From": **Azure Interior**; Location: **Stock1**; today's date.
3. Click "Add a product" → select `[DESK001] Desk`, qty `10`
4. Click **Save** → redirects to the receipt form with reference e.g. `WH/IN/0005`
5. Click **Mark as To Do** → status changes to READY
6. Click **Validate** → status changes to DONE, "Print" button appears
7. Go to `/stock` → Desk row now shows **60** on hand (was 50 + 10)
8. Go to `/history` → new green IN row: `WH/IN/0005, [DESK001] Desk, +10`
9. Print button triggers a proper A4 slip with logo, reference, contact, lines, signature

---

### d. Delivery Flow — Desk × 5
1. Go to `/deliveries/new`
2. Select Customer: **Gemini Furniture**; Source Location: **Stock1**; Delivery Address: any text
3. Add `[DESK001] Desk`, qty `5` → Available should show `60`
4. **Save** → redirects to delivery form
5. **Mark as To Do** → status READY (stock sufficient)
6. **Validate** → DONE; stock Desk drops to **55**
7. `/history` → red OUT row: `+WH/OUT/…, Desk, -5`

---

### e. Delivery — Insufficient Stock → WAITING → Restock → READY
1. Create delivery: `[CHAIR001] Chair`, qty `20` (only 3 on hand)
2. **Mark as To Do** → toast: `"Insufficient stock…"`, status becomes **WAITING**
3. Go to `/receipts/new`, receive Chair × 20 from Azure Interior to Stock1, **Validate**
4. Go back to the WAITING delivery → click **Check Availability** → status changes to **READY**
5. **Validate** → DONE; Chair stock becomes 3 + 20 − 20 = 3

---

### f. Internal Transfer — Stock1 → Rack A
1. Go to `/internal/new`
2. From: **Stock1**; To: **Rack A**; add `[DESK001] Desk`, qty `5`
3. **Save** → **Mark as To Do** → **Validate**
4. Go to `/stock` with location filter **All Locations**:
   - Desk/Stock1 shows `50` (was 55 − 5) ← (depends on prior steps)
   - Desk/Rack A shows `5` (new row)
   - **Total on hand is unchanged**
5. `/history` → violet INTERNAL row: `Desk, Stock1 → Rack A, +5`

---

### g. Adjustment — Lower Chair to 2
1. Go to `/adjustments/new`
2. Select Location: **Stock1**; add `[CHAIR001] Chair`, Counted Qty: `2`
3. Difference shows **−1** (or whatever the gap is) in red
4. **Save** → **Mark as To Do** → **Validate / Apply**
5. `/stock` → Chair shows **2** on hand
6. `/history` → amber ADJUSTMENT row for Chair

---

### h. Dashboard Numbers — Before & After
| Step | Pending Receipts | Pending Deliveries | Waiting | Low Stock |
|------|------------------|--------------------|---------|-----------|
| After seed | 3 (WH/IN/0002, 0003, 0004) | 1 (WH/OUT/0002) | 1 | Chair |
| After validating WH/IN/0003 | 2 | 1 | 1 | Chair |
| After creating new receipt (DRAFT) | 3 | 1 | 1 | Chair |

---

### i. Real-time — Two Windows
1. Open http://localhost:5173 in **Window 1** and **Window 2** (both logged in).
2. In Window 1, open any receipt and click **Validate**.
3. In Window 2, the **Dashboard** pending receipt count and **Stock Levels** update automatically within seconds — no browser refresh needed.
4. This works because the server emits a `stock:changed` Socket.IO event on every validate, and the React Query client in each window invalidates all inventory queries on receipt.

---

## 4. KNOWN LIMITATIONS

> Nothing has been exhaustively tested. The following items are partial, stubbed, or not fully aligned with SPEC.md.

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 1 | **Print layout** | ⚠️ Partial | A proper A4 print stylesheet exists (logo, reference, contact, lines, signature). Saving as PDF works via browser Print → Save as PDF. Not tested on all browsers. |
| 2 | **Settings CRUD** | ⚠️ Partial | Warehouses, Locations, Contacts all have working tables and create/edit modals. Delete buttons exist but may use `alert()` confirmations rather than a custom dialog. |
| 3 | **My Profile** | ⚠️ Partial | Edit name/email and change-password forms exist. Server-side password validation for incorrect "current password" may return a generic 400 error instead of a friendly message. |
| 4 | **Notification bell** | ⚠️ Partial | Polls every 10 seconds via React Query. Does not use the Socket.IO real-time channel for the notification dropdown items specifically — changes appear after the next poll cycle rather than instantly. |
| 5 | **Real-time on list pages** | ⚠️ Partial | `App.tsx` listens to `stock:changed` and `operation:changed` socket events and invalidates all query keys. However, if the server does not emit these events on every operation (e.g., on seeded operations or DB-level changes), a second tab may not update until the next React Query `refetchInterval`. Dashboard polls every 30 s. |
| 6 | **Delivery form — Available column** | ⚠️ Partial | The Available qty in the products table is computed client-side from product stock quants. It is always shown (not only in edit mode), and insufficient lines are shown in red. |
| 7 | **Operation form updates** | ⚠️ Partial | Once an operation is created (saved), its header fields (contact, location, date) cannot be edited via the form — only status transitions are supported. A full edit flow would require a PATCH `/operations/:id` endpoint. |
| 8 | **Receipt form — vendor combobox with "Create new"** | ❌ Missing | The spec calls for a vendor combobox with an inline "create new" option. The current form uses a plain select dropdown. |
| 9 | **Dashboard filters** | ❌ Missing | The spec calls for dynamic filters (document type, status, warehouse/location, product category) on the dashboard. These are not implemented; the cards always show global counts. |
| 10 | **Dashboard charts** | ⚠️ Partial | Operations-by-type bar chart is implemented. Stock In vs Out (30-day line chart) and Stock Value by Category (bar chart) are not rendered (the dashboard shows the operations trend bar chart only). |
| 11 | **Reorder rules UI** | ❌ Missing | Reorder rules are seeded for Desk and Chair, and are used in the Low Stock calculation, but there is no UI page to manage reorder rules. |
| 12 | **Forgot Password OTP email** | ⚠️ Partial | OTP is generated and hashed on the server. If no SMTP env vars are set, the OTP is printed to the server console log instead of emailed. |
| 13 | **Mobile responsive layout** | ⚠️ Partial | Sidebar collapses with a toggle button. Tables do not become stacked cards on mobile as specified. |
| 14 | **No automated tests** | ⚠️ Untested | No Playwright E2E tests have been run. No Vitest unit tests have been run against the current code. All scenarios above are based on code reading, not verified execution. |
