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

    const trend = await prisma.operation.groupBy({
      by: ['type'],
      _count: { id: true },
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const stockByCategoryMap = new Map<string, number>();
    for (const q of quants) {
      if (q.product.categoryId) {
        const catId = q.product.categoryId;
        const val = Number(q.quantity) * Number(q.product.unitCost);
        stockByCategoryMap.set(catId, (stockByCategoryMap.get(catId) || 0) + val);
      }
    }
    const categories = await prisma.category.findMany();
    const stockByCategory = categories.map(c => ({
      name: c.name,
      value: stockByCategoryMap.get(c.id) || 0
    })).filter(c => c.value > 0);

    const topProducts = productEntries
      .map(e => ({ name: e.product.name, value: e.qty * Number(e.product.unitCost) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentAllMoves = await prisma.stockMove.findMany({
      where: { date: { gte: fourteenDaysAgo }, direction: { in: ['IN', 'OUT'] } }
    });
    const movesByDate = new Map<string, { date: string; in: number; out: number }>();
    for (const m of recentAllMoves) {
      const d = new Date(m.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (!movesByDate.has(d)) movesByDate.set(d, { date: d, in: 0, out: 0 });
      if (m.direction === 'IN') movesByDate.get(d)!.in += Number(m.quantity);
      if (m.direction === 'OUT') movesByDate.get(d)!.out += Number(m.quantity);
    }
    const stockInVsOut = Array.from(movesByDate.values());

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
      stockByCategory,
      topProducts,
      stockInVsOut
    });
  } catch (error) {
    next(error);
  }
});

export const dashboardRouter = router;
