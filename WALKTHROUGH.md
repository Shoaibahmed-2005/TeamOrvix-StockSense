# Stocksense Walkthrough

## 1. HOW TO RUN

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)

### Setup the Databases
You will need two PostgreSQL databases: one for the main application and one for tests.
Run the following in `psql` or your database manager:
```sql
CREATE DATABASE stocksense;
CREATE DATABASE stocksense_test;
```

### Environment Variables
In the `server/` directory, create a `.env` file (you can copy `.env.example`):
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stocksense?schema=public"
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stocksense_test?schema=public"
JWT_SECRET="super-secret-jwt-key"
```
*(Adjust the username, password, and port in the `DATABASE_URL` to match your local Postgres setup).*

### Exact Commands
From the root of the project, run the following commands sequentially:

1. **Install all dependencies**
   ```bash
   npm install
   ```

2. **Reset the database and seed it**
   ```bash
   npm run db:reset --workspace=server
   ```
   *(This applies migrations and populates the database with initial locations, products, and a demo user).*

3. **Start the application**
   ```bash
   npm run dev
   ```

### URLs to Open
- **Client Application:** http://localhost:5173
- **API Server:** http://localhost:3000

### Demo Login
- **Login ID:** `demouser`
- **Password:** `Password!123`

---

## 2. PAGE-BY-PAGE GUIDE

### Dashboard
- **Route:** `/`
- **Controls:** 
  - 4 high-level stat cards (Total Products, Pending Receipts, Pending Deliveries, Total Inventory Value).
  - Recent Activity (Moves) block.
  - Operations (Last 7 Days) bar chart.
  - Low Stock Alerts panel.
- **Seed Data Expected:** After seeding, stats should reflect the seed products and categories. Operations might be empty until you create some.

### Notification Bell (Header)
- **Controls:** Click the bell icon to open the Notifications Popover.
- **What it does:** Displays polled alerts for Low Stock, Pending Receipts, and Pending Deliveries.

### Receipts
- **Route:** `/receipts`
- **Controls:** 
  - "New Receipt" button (navigates to `/receipts/new`).
  - Search bar (reference or vendor).
  - Status filter, Location filter, Date filter.
  - List / Kanban toggle buttons.
- **Seed Data Expected:** Empty list initially.

### Receipt Form
- **Route:** `/receipts/new` or `/receipts/:id`
- **Controls:**
  - "Receive From" (Vendor) select, "Destination Location" select, "Schedule Date" input.
  - Status stepper (Draft › Ready › Done).
  - "To Do" button (moves Draft to Ready).
  - "Validate" button (moves Ready to Done and updates stock).
  - "Cancel" button.
  - "Print" button (only visible when Done).
  - Products Table: "Add a product" line, product select, quantity input, delete icon.

### Deliveries
- **Route:** `/deliveries`
- **Controls:** 
  - Same filters, search, and List/Kanban toggle as Receipts.
  - "New Delivery" button.
- **Seed Data Expected:** Empty list initially.

### Delivery Form
- **Route:** `/deliveries/new` or `/deliveries/:id`
- **Controls:**
  - Status stepper (Draft › Waiting › Ready › Done).
  - "To Do" button (checks availability).
  - "Check Availability" button (if Waiting).
  - "Validate" button (completes delivery).
  - Products Table with quantities. If stock is insufficient, displays a red border indicator (in edit mode).

### Internal Transfers
- **Route:** `/internal`
- **Controls:** 
  - Same list views and filters.
  - "New Transfer" button.
- **Seed Data Expected:** Empty list initially.

### Adjustments
- **Route:** `/adjustments`
- **Controls:** 
  - Same list views and filters.
  - "New Adjustment" button.
- **Seed Data Expected:** Empty list initially.

### Move History
- **Route:** `/history`
- **Controls:** 
  - Search bar.
  - Direction Filter (IN, OUT, INTERNAL, ADJUSTMENT, ALL).
  - List / Kanban toggle buttons.
  - "Export CSV" button (downloads the filtered view).
- **Seed Data Expected:** Empty list initially (or contains adjustments if products were created with initial stock).

### Products
- **Route:** `/products`
- **Controls:** 
  - Search bar.
  - "Add Product" button (opens a modal).
  - Edit button (pencil icon on each row, opens modal).
  - **Product Modal:** Fields for SKU, Name, Category, UoM, Unit Cost. When adding a *new* product, "Initial Stock" and "Initial Location" fields are visible. When *editing*, a "Stock Details" breakdown is displayed.
- **Seed Data Expected:** 3 seeded products (Office Chair, Standing Desk, Laptop Stand).

### Stock Levels
- **Route:** `/stock`
- **Controls:** 
  - Table displaying stock aggregated by Product and Location.
  - Inline "Edit" button to perform a quick adjustment.
- **Seed Data Expected:** Empty initially, or matching initial stock quantities if set.

### Categories
- **Route:** `/categories`
- **Controls:** 
  - "Add Category" button.
  - List of categories.
- **Seed Data Expected:** 2 seeded categories (Furniture, Electronics).

### Settings: Warehouses
- **Route:** `/settings/warehouses`
- **Controls:** Form to create/edit warehouse (Name, Short Code, Address).
- **Seed Data Expected:** Main Warehouse (WH).

### Settings: Locations
- **Route:** `/settings/locations`
- **Controls:** Form to create/edit location (Name, Short Code, Type, Warehouse).
- **Seed Data Expected:** WH/Stock (Internal), Vendors (Vendor), Customers (Customer), Inventory Adjustment (Adjustment).

### Settings: Contacts
- **Route:** `/settings/contacts`
- **Controls:** Form to create/edit contact (Name, Email, Phone, Address, Type).
- **Seed Data Expected:** Vendor A, Customer B.

### My Profile (Dropdown)
- **Route:** `/settings/profile`
- **Controls:** Edit Full Name/Email, Change Password, Logout.

---

## 3. TEST SCENARIOS

**a. Login with wrong password**
- Steps: Go to `/login`. Enter Login ID: `demouser`, Password: `wrongpassword`. Click Login.
- Expected Result: Toast or inline error stating exactly "Invalid Login Id or Password".

**b. Sign up with a weak password**
- Steps: Go to `/signup`. Fill in details but enter `password` in the password field.
- Expected Result: Live checklist indicates missing requirements (uppercase, number/special character, minimum 9 chars).

**c. Receipt Flow**
- Steps: Go to `/receipts`. Click "New Receipt". Add "Standing Desk", qty 10. Click "To Do", then click "Validate".
- Expected Result: Status changes to Done. "Print" button appears. Go to Stock page, see +10 Standing Desks. Go to Move History, see a green row for the IN move.

**d. Delivery Flow**
- Steps: Go to `/deliveries`. Click "New Delivery". Add "Standing Desk", qty 5. Click "To Do" then "Validate".
- Expected Result: Status changes to Done. Stock page shows quantity is now 5. Move History shows a blue OUT row.

**e. Delivery for more than available**
- Steps: Create another delivery for "Standing Desk", qty 15 (when only 5 exist). Click "To Do".
- Expected Result: Status becomes "Waiting". A toast/error indicating insufficient stock appears. Receive 10 more desks via a Receipt. Go back to the Waiting Delivery, click "Check Availability". Status changes to "Ready".

**f. Internal Transfer**
- Steps: Go to `/internal`. New transfer of "Standing Desk" qty 1 from WH/Stock to another internal location. Validate.
- Expected Result: Total quantity of Standing Desk remains unchanged on Stock page, but split across the two locations. Move History shows INTERNAL direction.

**g. Adjustment**
- Steps: Go to `/adjustments`. Create adjustment for "Standing Desk" at WH/Stock setting counted qty lower (e.g., 2 instead of 4). Validate.
- Expected Result: Stock updates to 2 immediately. Move History shows an ADJUSTMENT row reflecting the negative change.

**h. Dashboard numbers before/after each step**
- Steps: Check Dashboard before a flow. Create a Draft Receipt. Check Dashboard.
- Expected Result: Dashboard "Pending Receipts" counter increases by 1.

**i. Real-time updates**
- Steps: Open the application in two side-by-side browser windows. In Window 1, validate a Receipt.
- Expected Result: In Window 2, the Dashboard stats and Notification Bell update automatically without refreshing the page.

---

## 4. KNOWN LIMITATIONS

Please note the following partial, stubbed, or known incomplete features:

- **Notifications & Dashboard "N to Receive" / "N to Deliver":** While the Dashboard correctly displays `pendingReceipts` and `pendingDeliveries`, it does not strictly split them into "Late / Waiting / Operations" as requested in complex variants of `SPEC.md`. The Notification bell is wired to poll these top-level numbers every 10 seconds, but it does not use the Socket.io real-time connection for the dropdown items.
- **Print Functionality:** The Print button appears when an operation is `DONE`, but the actual PDF/Print layout is stubbed to a basic browser print of the screen.
- **Settings CRUD:** While Contacts, Locations, and Warehouses have working forms and tables, the UX for inline editing vs modal adding is partially unified. 
- **My Profile:** The UI allows changing password and profile details, but error states for incorrect "current password" may fall back to generic 400 errors.
- **Real-time Syncing:** Socket.io emits events on the backend (`stockEngine.ts`), but not all frontend lists (e.g., ReceiptsList, DeliveriesList) aggressively re-fetch on these socket events. Only specific components (like the Dashboard via polling) guarantee updates across multiple browser windows out-of-the-box.
- **Unverified Status:** None of these features have been heavily tested via automated Playwright E2E tests yet. Bugs may be present in edge cases, especially around multi-line reservations and cancel flows.
