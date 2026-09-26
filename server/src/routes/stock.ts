import { Router } from 'express';
import { prisma } from '../db/prisma.js';

export const stockRouter = Router();

// GET /api/stock
stockRouter.get('/', async (req, res, next) => {
  try {
    const stock = await prisma.stockQuant.findMany({
      include: {
        product: true,
        location: true,
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
