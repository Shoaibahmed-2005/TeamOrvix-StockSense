import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../db/prisma.js';
import { lockStockQuants } from '../db/engine.js';
import { Prisma } from '@prisma/client';

describe('Concurrency & Locking', () => {
  let warehouseId: string;
  let locationId: string;
  let productId: string;

  beforeEach(async () => {
    const warehouse = await prisma.warehouse.create({
      data: { name: 'Test WH', shortCode: 'TWH' },
    });
    warehouseId = warehouse.id;

    const location = await prisma.location.create({
      data: { name: 'Test Loc', shortCode: 'TLOC', warehouseId },
    });
    locationId = location.id;

    const product = await prisma.product.create({
      data: { name: 'Test Product', sku: 'TST001' },
    });
    productId = product.id;

    // Create 1 unit of stock
    await prisma.stockQuant.create({
      data: {
        productId,
        locationId,
        quantity: 1,
      },
    });
  });

  it('prevents concurrent overselling using row locking and CHECK constraint', async () => {
    // Attempt two simultaneous deliveries of 1 unit each
    const attemptDelivery = async () => {
      return prisma.$transaction(async (tx) => {
        // 1. Lock the stock row
        await lockStockQuants(tx, locationId, [productId]);

        // 2. Read stock
        const stock = await tx.stockQuant.findUnique({
          where: { productId_locationId: { productId, locationId } },
        });

        if (!stock) throw new Error('Stock not found');

        // 3. Subtract 1 unit (simulating delivery validation)
        await tx.stockQuant.update({
          where: { id: stock.id },
          data: { quantity: new Prisma.Decimal(stock.quantity.toNumber() - 1) },
        });

        return 'success';
      });
    };

    const results = await Promise.allSettled([
      attemptDelivery(),
      attemptDelivery(),
    ]);

    // One must succeed, one must fail
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    // The rejected one should fail due to the CHECK constraint we added in the migration
    // (or application-level logic if we checked it, but here we depend on DB constraints)
    const error = rejected[0] as PromiseRejectedResult;
    expect(error.reason.message).toMatch(/Check constraint violation|quantity_non_negative/i);

    // Final stock must be exactly 0
    const finalStock = await prisma.stockQuant.findUnique({
      where: { productId_locationId: { productId, locationId } },
    });
    expect(finalStock?.quantity.toNumber()).toBe(0);
  });
});
