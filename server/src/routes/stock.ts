import { Router } from 'express';
import { prisma } from '../db/prisma.js';

export const stockRouter = Router();

// GET /api/stock/summary — aggregated totals per product across all internal locations
// Returns: { productId, product, totalOnHand, totalReserved, freeToUse, locations: [...per-location rows] }
stockRouter.get('/summary', async (req, res, next) => {
  try {
    const quants = await prisma.stockQuant.findMany({
      where: { location: { type: 'INTERNAL' } },
      include: { product: { include: { category: true } }, location: { include: { warehouse: true } } },
      orderBy: [{ product: { name: 'asc' } }, { location: { name: 'asc' } }]
    });

    // Group by productId
    const map = new Map<string, {
      productId: string;
      product: any;
      totalOnHand: number;
      totalReserved: number;
      locations: { locationId: string; location: any; quantity: number; reservedQuantity: number }[];
    }>();

    for (const q of quants) {
      if (!map.has(q.productId)) {
        map.set(q.productId, {
          productId: q.productId,
          product: q.product,
          totalOnHand: 0,
          totalReserved: 0,
          locations: []
        });
      }
      const entry = map.get(q.productId)!;
      entry.totalOnHand += Number(q.quantity);
      entry.totalReserved += Number(q.reservedQuantity);
      entry.locations.push({
        locationId: q.locationId,
        location: q.location,
        quantity: Number(q.quantity),
        reservedQuantity: Number(q.reservedQuantity)
      });
    }

    const result = Array.from(map.values()).map(e => ({
      ...e,
      freeToUse: e.totalOnHand - e.totalReserved
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/stock — raw per-location rows (used by adjustments inline edit)
stockRouter.get('/', async (req, res, next) => {
  try {
    const stock = await prisma.stockQuant.findMany({
      where: { location: { type: 'INTERNAL' } },
      include: {
        product: { include: { category: true } },
        location: { include: { warehouse: true } },
      },
      orderBy: [
        { product: { name: 'asc' } },
        { location: { name: 'asc' } }
      ]
    });
    res.json(stock);
  } catch (err) {
    next(err);
  }
});

// GET /api/stock/locations
stockRouter.get('/locations', async (req, res, next) => {
  try {
    const locations = await prisma.location.findMany({
      where: { type: 'INTERNAL' },
      include: { warehouse: true },
      orderBy: { name: 'asc' },
    });
    res.json(locations);
  } catch (err) {
    next(err);
  }
});
