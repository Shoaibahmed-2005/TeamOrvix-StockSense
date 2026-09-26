import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Test the database connection on startup and log a user-friendly error
 * instead of a raw stack trace if PostgreSQL is not reachable.
 */
export async function checkDbConnection(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('ECONNREFUSED') || msg.includes('connect') || msg.includes('Can\'t reach')) {
      console.error(
        '\n❌ Cannot connect to PostgreSQL — check it is running and DATABASE_URL in server/.env\n',
        `   URL: ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@') ?? '(not set)'}\n`,
        `   Error: ${msg}\n`
      );
    } else {
      console.error('\n❌ Database error on startup:', msg, '\n');
    }
    process.exit(1);
  }
}
