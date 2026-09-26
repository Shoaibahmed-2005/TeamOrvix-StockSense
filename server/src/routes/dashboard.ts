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
    // For simplicity, just return everything we have
    const totalValue = quants.reduce((acc, q) => acc + (Number(q.quantity) * Number(q.product.unitCost)), 0);

    res.json({
      productsCount,
      categoriesCount,
      pendingReceipts,
      pendingDeliveries,
      totalInventoryValue: totalValue
    });
  } catch (error) {
    next(error);
  }
});

export const dashboardRouter = router;
