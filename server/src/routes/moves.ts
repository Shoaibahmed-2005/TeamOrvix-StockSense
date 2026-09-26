import { Router } from "express";
import { prisma } from "../db/prisma.js";

const router = Router();

const moveInclude = {
  product: true,
  fromLocation: true,
  toLocation: true,
  contact: true,
  user: true,
  operation: { select: { reference: true, type: true } },
} as const;

// GET /api/moves
router.get("/", async (req, res, next) => {
  try {
    const { search, productId, locationId, direction, from, to } = req.query;

    const where: any = {};
    if (productId) where.productId = productId;
    if (direction && direction !== 'ALL') where.direction = direction;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }
    if (search) {
      where.OR = [
        { reference: { contains: search as string, mode: 'insensitive' } },
        { product: { name: { contains: search as string, mode: 'insensitive' } } },
        { contact: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }
    if (locationId) {
      where.OR = [
        ...(where.OR || []),
        { fromLocationId: locationId },
        { toLocationId: locationId },
      ];
    }

    const moves = await prisma.stockMove.findMany({
      where,
      include: moveInclude,
      orderBy: { date: 'desc' }
    });
    res.json(moves);
  } catch (error) {
    next(error);
  }
});

// GET /api/moves/export.csv
router.get("/export.csv", async (req, res, next) => {
  try {
    const { search, direction, from, to } = req.query;
    const where: any = {};
    if (direction && direction !== 'ALL') where.direction = direction;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }
    if (search) {
      where.OR = [
        { reference: { contains: search as string, mode: 'insensitive' } },
        { product: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const moves = await prisma.stockMove.findMany({
      where,
      include: moveInclude,
      orderBy: { date: 'desc' }
    });

    const headers = ["Reference", "Date", "Contact", "From", "To", "Product", "Quantity", "Direction"];
    const rows = moves.map(m => [
      m.reference,
      m.date.toLocaleDateString('en-IN'),
      (m as any).contact?.name || "",
      (m as any).fromLocation?.name || "",
      (m as any).toLocation?.name || "",
      (m as any).product?.name || "",
      m.direction === 'OUT' || (m.direction === 'ADJUSTMENT' && Number(m.quantity) < 0) ? `-${Math.abs(Number(m.quantity))}` : `+${Math.abs(Number(m.quantity))}`,
      m.direction,
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=move_history.csv");
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

export const movesRouter = router;
