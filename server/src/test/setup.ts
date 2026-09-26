import { beforeEach } from 'vitest';
import { prisma } from '../db/prisma.js';

// Per-test table truncation for isolation (DB schema is reset once in globalSetup)
beforeEach(async () => {
  const tableNames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname='public' AND tablename != '_prisma_migrations';
  `;
  const tables = tableNames.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  if (tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }
});
