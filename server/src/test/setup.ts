import { beforeEach, beforeAll } from 'vitest';
import { prisma } from '../db/prisma.js';
import { execSync } from 'child_process';

beforeAll(() => {
  // Reset the database before the test run to ensure a clean schema
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
  
  execSync('npx prisma migrate reset --force --skip-seed', {
    stdio: 'inherit',
    env: { ...process.env },
  });
});

beforeEach(async () => {
  // Truncate all tables between tests to ensure isolation
  const tableNames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';`;

  const tables = tableNames
    .map(({ tablename }) => `"public"."${tablename}"`)
    .join(', ');

  if (tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }
});
