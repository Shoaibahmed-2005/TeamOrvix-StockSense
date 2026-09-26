import { Router } from 'express';
import { prisma } from '../db/prisma.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', async (req, res, next) => {
  try {
    const today = new Date();
    today.setUTCHours(today.getUTCHours() + 5, today.getUTCMinutes() + 30, 0, 0); // Convert to IST
    today.setUTCHours(0, 0, 0, 0); // IST midnight

    // Late Operations
    const lateOps = await prisma.operation.findMany({
      where: {
        scheduleDate: { lt: today },
        status: { notIn: ['DONE', 'CANCELLED'] }
      },
      select: {
        id: true,
        reference: true,
        type: true,
        scheduleDate: true,
      },
      orderBy: { scheduleDate: 'asc' },
      take: 5
    });

    // Low stock products
    const products = await prisma.product.findMany({
      include: {
        reorderRules: true
      }
    });

    const stock = await prisma.stockQuant.groupBy({
      by: ['productId'],
      _sum: { quantity: true, reservedQuantity: true }
    });

    const lowStock = [];
    for (const product of products) {
      if (!product.reorderRules.length) continue;
      const minQty = product.reorderRules[0].minQty;
      const productStock = stock.find((s: any) => s.productId === product.id);
      const onHand = productStock?._sum.quantity || 0;
      const reserved = productStock?._sum.reservedQuantity || 0;
      const freeToUse = Number(onHand) - Number(reserved);

      if (freeToUse < Number(minQty)) {
        lowStock.push({
          id: product.id,
          name: product.name,
          sku: product.sku,
          freeToUse,
          minQty: Number(minQty)
        });
      }
    }

    res.json({
      lateOperations: lateOps,
      lowStock: lowStock.slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
});
