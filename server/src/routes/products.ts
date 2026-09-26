import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { productSchema } from '@stocksense/shared';
import { Prisma } from '@prisma/client';

export const productRouter = Router();

// GET /api/products
productRouter.get('/', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
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
