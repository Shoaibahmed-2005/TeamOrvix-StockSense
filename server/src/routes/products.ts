import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { productSchema } from '@stocksense/shared';
import { Prisma } from '@prisma/client';

export const productRouter = Router();

// GET /api/products
productRouter.get('/', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: { 
        category: true,
        stockQuants: {
          include: { location: true }
        }
      },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// POST /api/products
productRouter.post('/', async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
        uom: data.uom as any,
        unitCost: new Prisma.Decimal(data.unitCost),
      },
      include: { category: true }
    });

    if (data.initialQty && data.initialQty > 0 && data.initialLocationId) {
      // Create inline stock adjustment
      const { stockEngine } = await import('../lib/stockEngine.js');
      
      // Need a warehouseId for the operation. Let's find the location's warehouse, 
      // or just any warehouse if not set.
      const location = await prisma.location.findUnique({
        where: { id: data.initialLocationId },
        select: { warehouseId: true }
      });
      let warehouseId = location?.warehouseId;
      if (!warehouseId) {
        const wh = await prisma.warehouse.findFirst();
        warehouseId = wh?.id;
      }
      
      if (warehouseId) {
        const op = await stockEngine.createOperation({
          type: 'ADJUSTMENT',
          warehouseId,
          destLocationId: data.initialLocationId,
          scheduleDate: new Date().toISOString(),
          operationTypeNote: 'Inline stock adjustment',
          lines: [{
            productId: product.id,
            quantity: data.initialQty,
            countedQuantity: data.initialQty
          }]
        }, (req as any).user?.id);
        
        await stockEngine.validateOperation(op.id, (req as any).user?.id);
      }
    }

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id
productRouter.put('/:id', async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
        uom: data.uom as any,
        unitCost: new Prisma.Decimal(data.unitCost),
      },
      include: { category: true }
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
});
