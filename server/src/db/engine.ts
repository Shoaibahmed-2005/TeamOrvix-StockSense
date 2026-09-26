import { Prisma, PrismaClient, OperationType, OperationStatus, MoveDirection } from '@prisma/client';
import { prisma } from './prisma.js';

export async function getNextReference(
  tx: Prisma.TransactionClient,
  warehouseId: string,
  operationCode: string
): Promise<string> {
  // Using native Postgres atomic update to ensure sequence numbers are never duplicated
  const result = await tx.$queryRaw<{ next_number: number }[]>`
    UPDATE "sequences"
    SET "next_number" = "next_number" + 1
    WHERE "warehouse_id" = ${warehouseId} AND "operation_code" = ${operationCode}
    RETURNING "next_number"
  `;

  if (result.length === 0) {
    throw new Error(`Sequence not found for warehouse ${warehouseId} and code ${operationCode}`);
  }

  const number = result[0].next_number - 1; // Since we just incremented it
  const warehouse = await tx.warehouse.findUniqueOrThrow({ where: { id: warehouseId } });
  
  return `${warehouse.shortCode}/${operationCode}/${String(number).padStart(4, '0')}`;
}

export async function lockStockQuants(
  tx: Prisma.TransactionClient,
  locationId: string,
  productIds: string[]
): Promise<void> {
  if (productIds.length === 0) return;
  // Lock the stock rows for update to prevent concurrent overselling
  await tx.$queryRaw`
    SELECT id FROM "stock_quants"
    WHERE "location_id" = ${locationId} AND "product_id" IN (${Prisma.join(productIds)})
    FOR UPDATE
  `;
}
