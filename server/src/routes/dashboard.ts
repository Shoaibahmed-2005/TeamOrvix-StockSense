import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// GET dashboard stats
router.get("/stats", async (req, res, next) => {
  try {
    const productsCount = await prisma.product.count();
    const categoriesCount = await prisma.category.count();
    const pendingReceipts = await prisma.operation.count({ where: { type: 'RECEIPT', status: { in: ['DRAFT', 'READY'] } } });
    const pendingDeliveries = await prisma.operation.count({ where: { type: 'DELIVERY', status: { in: ['DRAFT', 'WAITING', 'READY'] } } });
    
    // Low stock products
    const quants = await prisma.stockQuant.findMany({
      include: { product: true }
    });
    const totalValue = quants.reduce((acc, q) => acc + (Number(q.quantity) * Number(q.product.unitCost)), 0);

    // Get stock per product
    const stockMap = new Map();
    for (const q of quants) {
      const current = stockMap.get(q.productId) || 0;
      stockMap.set(q.productId, current + Number(q.quantity));
    }
    const lowStockProducts = Array.from(stockMap.entries())
      .filter(([_, qty]) => qty < 10) // Threshold
      .map(([productId, qty]) => {
        const product = quants.find(q => q.productId === productId)?.product;
        return { product, quantity: qty };
      })
      .slice(0, 5);

    // Recent moves
    const recentMoves = await prisma.stockMove.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: { product: true, operation: true }
    });

    // Stock trend (last 7 days operations count)
    const trend = await prisma.operation.groupBy({
      by: ['type'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    res.json({
      productsCount,
      categoriesCount,
      pendingReceipts,
      pendingDeliveries,
      totalInventoryValue: totalValue,
      lowStockProducts,
      recentMoves,
      trend
    });
  } catch (error) {
    next(error);
  }
});

export const dashboardRouter = router;
