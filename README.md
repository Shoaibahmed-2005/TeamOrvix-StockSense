<div align="center">
  <img src="./client/public/brand/stocksenselogo.png" alt="Stocksense Logo" width="300" />

  <h1>Stocksense</h1>
  <p>Inventory management that feels like magic.</p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.IO" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  </p>
</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Domain Model](#domain-model)
- [Business Rules & Data Integrity](#business-rules--data-integrity)
- [API Reference](#api-reference)
- [Real-Time Sync](#real-time-sync)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Design System](#design-system)
- [Development Workflow](#development-workflow)
- [Development Process](#development-process)
- [Roadmap](#roadmap)
- [Team](#team)
- [License](#license)

## Overview

**The Problem:** Small to medium warehouses often rely on manual registers, complex Excel spreadsheets, or clunky legacy systems. These lead to overselling, slow operations, and desynchronized inventory counts.

**The Solution:** **Stocksense** is a modern, real-time inventory management system designed for speed, accuracy, and ease of use. With an append-only ledger, transactional safety, and instant UI updates via WebSockets, warehouse operations become seamless and transparent.

**Target Users:** Inventory Managers, Warehouse Staff, and Operations Leads.

## Features

- **Authentication:** Login ID based auth, strict signup rules, OTP password reset, protected routes.
- **Dashboard:** At-a-glance KPIs, stock value by category, recent moves, 14-day stock flow area charts, top products, and quick-action alerts for late or waiting operations.
- **Operations:**
  - **Receipts:** Draft → Ready → Done workflows for inbound stock.
  - **Deliveries:** Draft → Waiting → Ready → Done workflows for outbound stock, with robust availability checking.
  - **Internal Transfers:** Move stock across locations seamlessly.
  - **Adjustments:** Handle write-offs or audits effortlessly.
- **Stock & Products:** Comprehensive product catalogs, automatic reorder rules, real-time on-hand vs. reserved quantities, categorization.
- **Move History:** Append-only, immutable stock ledger tracking every individual move with direction (IN/OUT/INTERNAL), colored indicators, and CSV export.
- **Multi-Warehouse:** Create multiple warehouses and precise bin/shelf tracking via nested Locations.
- **Real-Time Sync:** Socket.IO ensures that when a receipt is validated by one user, the dashboard and stock lists update instantly for everyone else.
- **Notifications:** Dropdown alerts for low stock items and late operations.
- **UX & Design:** Fully responsive layout, intelligent mobile drawers, and an instant Light/Dark mode toggle based on a premium HSL design system.
- **Print Slips:** Generate operational slips (receipts/deliveries) in print-friendly layouts.

## Screenshots

| Login | Dashboard |
| --- | --- |
| ![Login](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Receipt Form | Delivery (Insufficient Stock) |
| --- | --- |
| ![Receipt Form](docs/screenshots/receipt-form.png) | ![Delivery Warning](docs/screenshots/delivery-warning.png) |

| Move History | Dark Mode |
| --- | --- |
| ![Move History](docs/screenshots/move-history.png) | ![Dark Mode](docs/screenshots/dark-mode.png) |

## Tech Stack

| Layer | Technology | Why Chosen |
| --- | --- | --- |
| **Frontend** | React + Vite | Fast HMR, excellent component ecosystem, and optimized builds. |
| **State & Data** | TanStack Query | Automatic caching, background refetching, and robust mutation handling. |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid styling with a strict design system and accessible unstyled primitives. |
| **Backend** | Node.js + Express | Lightweight, proven REST API framework with great TypeScript support. |
| **Database** | PostgreSQL | ACID compliant, reliable relational data store with constraint support. |
| **ORM** | Prisma | Type-safe database client and straightforward migration system. |
| **Real-Time** | Socket.IO | Reliable bi-directional event-based communication for live data sync. |
| **Validation** | Zod | End-to-end type safety and runtime payload validation. |

## Architecture

### System Flow
```mermaid
flowchart LR
    Client[React Client\nTanStack Query] -->|REST API| API[Express API]
    API -->|Validates| Zod[Zod Schemas]
    API -->|Queries/Mutates| Prisma[Prisma ORM]
    Prisma -->|Executes SQL| DB[(PostgreSQL)]
    API -.->|Emits Events| Socket[Socket.IO Server]
    Socket -.->|Invalidate Keys| Client
```

### Validation Sequence: "Validate a Delivery"
```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant DB as Database
    participant S as Socket.IO
    
    C->>A: POST /operations/:id/validate
    A->>A: Zod Validation
    A->>DB: BEGIN Transaction
    A->>DB: SELECT ... FOR UPDATE (Row Lock Quants)
    A->>A: Check Free Quantity >= Requested
    alt Insufficient Stock
        A->>DB: ROLLBACK
        A-->>C: 400 Bad Request (Insufficient Stock)
    else Sufficient Stock
        A->>DB: UPDATE Quants (Deduct)
        A->>DB: INSERT StockMoves
        A->>DB: UPDATE Operation (Status = DONE)
        A->>DB: COMMIT
        A->>S: emit 'invalidate', ['stock', 'operations']
        A-->>C: 200 OK
    end
    S-->>C: Invalidate Query Cache (Live Reload)
```

## Domain Model

### Entity-Relationship Diagram
```mermaid
erDiagram
    User {
        String id
        String loginId
        String password
        String fullName
        String role
    }
    Product {
        String id
        String sku
        String name
        Decimal unitCost
    }
    Category {
        String id
        String name
    }
    Warehouse {
        String id
        String name
        String code
    }
    Location {
        String id
        String name
        String type
    }
    Contact {
        String id
        String name
        String type
    }
    Operation {
        String id
        String reference
        String type
        String status
        DateTime scheduleDate
    }
    OperationLine {
        String id
        Decimal quantity
    }
    StockMove {
        String id
        String reference
        Decimal quantity
        String direction
    }
    StockQuant {
        String id
        Decimal quantity
    }

    Product }|--|| Category : belongsTo
    Location }|--|| Warehouse : belongsTo
    Operation }|--|| Location : fromLocation
    Operation }|--|| Location : toLocation
    Operation }|--|| Contact : contact
    OperationLine }|--|| Operation : belongsTo
    OperationLine }|--|| Product : refersTo
    StockMove }|--|| Product : moves
    StockMove }|--|| Operation : causedBy
    StockQuant }|--|| Product : tracks
    StockQuant }|--|| Location : residesIn
```

### Operation Lifecycle
```mermaid
stateDiagram-v2
    %% Receipt Lifecycle
    state Receipt {
        [*] --> DRAFT_R : Created
        DRAFT_R --> READY_R : Mark as To Do
        READY_R --> DONE_R : Validate
        DRAFT_R --> CANCELLED_R : Cancel
        READY_R --> CANCELLED_R : Cancel
    }

    %% Delivery Lifecycle
    state Delivery {
        [*] --> DRAFT_D : Created
        DRAFT_D --> WAITING_D : Mark as To Do (No Stock)
        DRAFT_D --> READY_D : Mark as To Do (Stock Avail)
        WAITING_D --> READY_D : Check Availability (Success)
        READY_D --> DONE_D : Validate
        DRAFT_D --> CANCELLED_D : Cancel
        WAITING_D --> CANCELLED_D : Cancel
        READY_D --> CANCELLED_D : Cancel
    }
```

## Business Rules & Data Integrity

- **Atomic Sequences:** Operations generate strictly formatted references (e.g., `WH/OUT/0001`) atomically.
- **Stock Definitions:**
  - **On Hand:** Total physical stock present in an internal location.
  - **Reserved:** Stock attached to `READY` outbound operations.
  - **Free to Use:** `On Hand - Reserved`.
- **Transactional Safety:** All status validations use interactive Prisma transactions (`$transaction(async (tx) => ...)`).
- **Row-Level Locking:** Uses `SELECT ... FOR UPDATE` during delivery validation to prevent race conditions and overselling.
- **Constraints:** PostgreSQL `CHECK (quantity >= 0)` constraints strictly guarantee stock never falls below zero at the database level.
- **Precision:** All quantities and costs use precise `Decimal` types to avoid floating point math errors.
- **Append-Only Ledger:** `StockMove` records are strictly insert-only to form an immutable audit trail.
- **Timezones:** Stored in UTC. Dashboard statistics resolve "today" based on `Asia/Kolkata` (IST) boundaries.

## API Reference

All protected routes require a Bearer token via the `Authorization` header.

### Standard Error Shape
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid payload",
    "fields": {
      "quantity": "Must be greater than 0"
    }
  }
}
```

### Endpoints

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| **Auth** |
| `POST` | `/api/auth/login` | Authenticate and retrieve JWT | No |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/forgot-password` | Request password reset OTP | No |
| `POST` | `/api/auth/reset-password` | Reset password using OTP | No |
| **Dashboard & Notifications** |
| `GET` | `/api/dashboard/stats` | Retrieve aggregate metrics and chart data | Yes |
| `GET` | `/api/notifications` | Fetch low stock and late operation alerts | Yes |
| **Products & Stock** |
| `GET` | `/api/products` | List products with on-hand & reserved calculations | Yes |
| `POST` | `/api/products` | Create a new product | Yes |
| `GET` | `/api/stock/quants` | Detailed stock levels per product and location | Yes |
| `GET` | `/api/stock/moves` | Immutable ledger of all inventory movements | Yes |
| **Operations** |
| `GET` | `/api/operations` | Filterable list of operations (`?type=RECEIPT`) | Yes |
| `POST` | `/api/operations` | Create a new draft operation | Yes |
| `PATCH` | `/api/operations/:id` | Update operation lines/details | Yes |
| `POST` | `/api/operations/:id/mark-todo` | Progress from `DRAFT` to `READY`/`WAITING` | Yes |
| `POST` | `/api/operations/:id/check-availability` | Attempt to transition `WAITING` to `READY` | Yes |
| `POST` | `/api/operations/:id/validate` | Execute operation, create moves, deduct stock | Yes |
| `POST` | `/api/operations/:id/cancel` | Mark operation as cancelled, release reserves | Yes |
| **Settings / Masters** |
| `GET` | `/api/warehouses` | List warehouses | Yes |
| `GET` | `/api/locations` | List internal/virtual bin locations | Yes |
| `GET` | `/api/contacts` | List vendors and customers | Yes |
| `GET` | `/api/categories` | List product categories | Yes |

## Real-Time Sync

Stocksense leverages Socket.IO to keep clients perfectly synced without manual refreshing.

**Server Emits:**
The API emits an `invalidate` event alongside an array of React Query cache keys whenever a mutation completes.
- Example: Validating a receipt emits `['operations', 'stock', 'products', 'dashboard']`.

**Client Listens:**
```typescript
socket.on('invalidate', (keys: string[]) => {
  keys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
});
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Shoaibahmed-2005/TeamOrvix-StockSense.git
   cd TeamOrvix-StockSense
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Database Setup:**
   Connect to your Postgres instance and create the development and test databases:
   ```sql
   CREATE DATABASE stocksense;
   CREATE DATABASE stocksense_test;
   ```

4. **Environment Variables:**
   Copy the example environment files and adjust if necessary.
   ```bash
   cp server/.env.example server/.env
   ```

   **`server/.env` variables:**
   | Variable | Description | Example |
   | --- | --- | --- |
   | `PORT` | API server port | `3001` |
   | `CLIENT_URL` | Allowed CORS origin | `http://localhost:5173` |
   | `DATABASE_URL` | Primary Postgres connection | `postgresql://user:pass@localhost:5432/stocksense` |
   | `TEST_DATABASE_URL` | Test Postgres connection | `postgresql://user:pass@localhost:5432/stocksense_test` |
   | `JWT_SECRET` | Secret key for auth tokens | `your-secret-key` |
   | `JWT_EXPIRES_IN` | Token validity duration | `7d` |

5. **Migrate & Seed the Database:**
   ```bash
   npm run db:reset
   ```
   *This commands resets the DB schema and injects realistic mock data (Warehouses, Products, Contacts, and Operations in various states).*

6. **Run Development Servers:**
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`

7. **Demo Login:**
   - **ID:** `admin01`
   - **Password:** `Admin@1234`

### Troubleshooting
- **Port 5432 in use:** Ensure another Postgres service isn't blocking it.
- **Prisma EPERM on Windows:** If `db:reset` fails, stop the backend server, run `npm run db:reset` again, then restart `npm run dev`.

## Scripts

| Script | Location | Description |
| --- | --- | --- |
| `npm run dev` | Root | Starts both Client (Vite) and Server (tsc-watch) concurrently |
| `npm run build` | Root | Builds shared, server, and client for production |
| `npm run db:reset` | Root | Drops DB, pushes schema, generates Prisma client, and runs seed script |
| `npm run db:studio` | Root | Opens Prisma Studio to visually inspect database rows |
| `npm test` | Root | Runs Jest test suites in the server workspace |

## Project Structure

```text
├── client/                # React Frontend
│   ├── public/            # Brand assets (logo, favicon)
│   ├── src/
│   │   ├── components/    # Reusable shadcn UI and Layout components
│   │   ├── lib/           # Utility functions, React Query keys, API client
│   │   └── pages/         # Route views (Auth, Dashboard, Operations, Settings)
├── server/                # Express API Backend
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema definition
│   │   └── seed.ts        # Comprehensive mock data generator
│   └── src/
│       ├── db/            # Prisma client instance
│       ├── middleware/    # Auth, error handling, Zod validation
│       └── routes/        # API route handlers
├── shared/                # Monorepo Shared Package
│   └── src/               # Zod schemas and TypeScript interfaces (imported by both)
├── docs/                  # Documentation
│   ├── screenshots/       # Markdown images
│   ├── SPEC.md            # Original requirements specification
│   ├── WALKTHROUGH.md     # Detailed page-by-page functional guide
│   └── PROGRESS.md        # Task checklist and milestone tracker
└── package.json           # Root workspace config
```

## Testing

Server tests use **Jest** and **Supertest** to validate endpoints against an isolated `stocksense_test` database.
- **Run Tests:** `npm test`
- **Coverage:** Tests currently validate core auth constraints, operation lifecycle state machines, and pessimistic concurrency locks to ensure quantities cannot go negative.

## Design System

Stocksense utilizes a premium, high-contrast HSL color system implemented via Tailwind CSS variables.

- **Primary:** Deep Purple (`#7A0B7E`) / Vibrant Pink-Purple (`#B83DB8` in Dark Mode)
- **Accent:** Hot Magenta (`#F00072`)
- **Status Colors:**
  - Success/In: Green (`#16A36A`)
  - Danger/Out: Red (`#E5484D`)
  - Warning/Adj: Amber (`#F59E0B`)
  - Info/Internal: Violet (`#7C5CFC`)
- **Typography:** Geist Variable (Sans) & Inter fallbacks.

## Development Workflow

1. **Branching Strategy:** Direct commits to `main` for rapid prototyping, or feature branches (`feat/feature-name`) for larger changes.
2. **Commit Convention:** [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat(nav): update topbar`, `fix(stock): resolve concurrency bug`).

## Development Process

This project was built iteratively using an AI-assisted development workflow within the **Google Antigravity** environment. 
1. The raw requirements were consolidated into a strict architecture spec (`docs/SPEC.md`).
2. Iterative agent milestones established the monorepo, database schema, REST API, real-time events, and finally, the frontend React application.
3. Every step was validated against business rules (no negative stock, strict operation lifecycles).

## Roadmap

- [ ] **Barcode Scanning:** Support for mobile device cameras to scan product SKUs during operation fulfillment.
- [ ] **Role-Based Access Control (RBAC):** Restrict access based on user roles (Admin vs. Warehouse Worker).
- [ ] **Sales/Purchase Orders:** Native integration with inbound POs and outbound SOs to automate Draft Operation generation.
- [ ] **Data Export & Reporting:** Advanced PDF and Excel exports for End-of-Day stock reconciliations.
- [ ] **Offline PWA Support:** Service workers to allow warehouse staff to operate in internet dead-zones and sync upon reconnect.

## Team

| Name | Role | GitHub |
| --- | --- | --- |
| Stocksense Team | Core Developers | [@Shoaibahmed-2005](https://github.com/Shoaibahmed-2005) |

## License

This project is licensed under the [MIT License](LICENSE).
