import { Router } from "express";
import { prisma } from "../db/prisma.js";

const router = Router();

// Helper: "today" in Asia/Kolkata (midnight IST)
function todayIST(): Date {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  // Midnight in IST
  const midnightIST = new Date(Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate()
  ) - istOffset);
  return midnightIST;
}

// GET /api/dashboard/stats
router.get("/stats", async (req, res, next) => {
  try {
    const today = todayIST();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [productsCount] = await Promise.all([
      prisma.product.count(),
    ]);

    // ── Receipt card metrics ────────────────────────────────────────────
    const [receiptsToReceive, receiptsLate, receiptsOperations] = await Promise.all([
      // N to Receive = READY
      prisma.operation.count({ where: { type: 'RECEIPT', status: 'READY' } }),
      // Late = scheduleDate < today AND not DONE/CANCELLED
      prisma.operation.count({ where: { type: 'RECEIPT', scheduleDate: { lt: today }, status: { notIn: ['DONE', 'CANCELLED'] } } }),
      // Operations = pending with scheduleDate > today
      prisma.operation.count({ where: { type: 'RECEIPT', scheduleDate: { gte: today }, status: { notIn: ['DONE', 'CANCELLED'] } } }),
    ]);

    // ── Delivery card metrics ───────────────────────────────────────────
    const [deliveriesToDeliver, deliveriesLate, deliveriesWaiting, deliveriesOperations] = await Promise.all([
      // N to Deliver = READY
      prisma.operation.count({ where: { type: 'DELIVERY', status: 'READY' } }),
      // Late = scheduleDate < today AND not DONE/CANCELLED
      prisma.operation.count({ where: { type: 'DELIVERY', scheduleDate: { lt: today }, status: { notIn: ['DONE', 'CANCELLED'] } } }),
      // Waiting = WAITING status
      prisma.operation.count({ where: { type: 'DELIVERY', status: 'WAITING' } }),
      // Operations = pending with scheduleDate > today
      prisma.operation.count({ where: { type: 'DELIVERY', scheduleDate: { gte: today }, status: { notIn: ['DONE', 'CANCELLED'] } } }),
    ]);

    // ── Internal Transfers Scheduled ────────────────────────────────────
    const internalScheduled = await prisma.operation.count({
      where: { type: 'INTERNAL', status: { notIn: ['DONE', 'CANCELLED'] } }
    });

    // ── Stock / Low Stock / Out of Stock ────────────────────────────────
    const quants = await prisma.stockQuant.findMany({
      where: { location: { type: 'INTERNAL' } },
      include: { product: { include: { reorderRules: true } } }
    });

    const totalValue = quants.reduce(
      (acc, q) => acc + Number(q.quantity) * Number(q.product.unitCost),
      0
    );

    // Aggregate per product
    const stockByProduct = new Map<string, { qty: number; product: any }>();
    for (const q of quants) {
      const existing = stockByProduct.get(q.productId);
      if (existing) {
        existing.qty += Number(q.quantity);
      } else {
        stockByProduct.set(q.productId, { qty: Number(q.quantity), product: q.product });
      }
    }

    const productEntries = Array.from(stockByProduct.values());

    const outOfStockCount = productEntries.filter(e => e.qty === 0).length;
    const lowStockProducts = productEntries
      .filter(e => {
        const minQty = e.product.reorderRules?.[0]?.minQty;
        return e.qty > 0 && minQty != null && e.qty <= Number(minQty);
      })
      .map(e => ({ product: e.product, quantity: e.qty }))
      .slice(0, 8);

    const lowStockCount = lowStockProducts.length;

    // ── Recent moves ────────────────────────────────────────────────────
    const recentMoves = await prisma.stockMove.findMany({
      take: 8,
      orderBy: { date: 'desc' },
      include: { product: true, operation: true }
    });

    // ── 30-day trend by type ────────────────────────────────────────────
    const trend = await prisma.operation.groupBy({
      by: ['type'],
      _count: { id: true },
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    res.json({
      productsCount,
      totalInventoryValue: totalValue,
      lowStockCount,
      outOfStockCount,
      receiptsToReceive,
      receiptsLate,
      receiptsOperations,
      deliveriesToDeliver,
      deliveriesLate,
      deliveriesWaiting,
      deliveriesOperations,
      internalScheduled,
      lowStockProducts,
      recentMoves,
      trend,
    });
  } catch (error) {
    next(error);
  }
});

export const dashboardRouter = router;
