# Stocksense

A complete, production-quality Inventory Management System (IMS) for tracking stock, operations (receipts, deliveries, internal transfers, adjustments), and generating real-time metrics.

## Tech Stack
- **Monorepo**: npm workspaces
- **Client**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- **Server**: Node.js, Express, Prisma ORM, Socket.IO
- **Database**: PostgreSQL 14+

## Prerequisites
- Node.js >= 24
- PostgreSQL >= 14

## Setup PostgreSQL Databases
Stocksense requires two databases: one for development and one for running tests.

1. Create a `stocksense` user and the two databases:
```sql
CREATE USER stocksense WITH PASSWORD 'stocksense_pass' CREATEDB;
CREATE DATABASE stocksense OWNER stocksense;
CREATE DATABASE stocksense_test OWNER stocksense;
```

2. Copy `server/.env.example` to `server/.env` and update the connection strings:
```env
DATABASE_URL="postgresql://stocksense:stocksense_pass@localhost:5432/stocksense?schema=public"
TEST_DATABASE_URL="postgresql://stocksense:stocksense_pass@localhost:5432/stocksense_test?schema=public"
```

## Running Locally

1. Install dependencies:
```bash
npm install
```

2. Reset and seed the database:
```bash
npm run db:reset
```

3. Start the client and server:
```bash
npm run dev
```

## Testing

API tests use Supertest and Vitest, hitting the test database securely via single-worker execution to avoid concurrency overlaps.

```bash
npm test
```

For End-to-End testing:
```bash
npm run test:e2e
```

## Seed Credentials
Demo User: `admin01`
Password: `Admin@1234`
