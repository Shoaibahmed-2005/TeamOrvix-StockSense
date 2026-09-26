import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { categorySchema } from '@stocksense/shared';

export const categoryRouter = Router();

// GET /api/categories
categoryRouter.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories
categoryRouter.post('/', async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({ data });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});
