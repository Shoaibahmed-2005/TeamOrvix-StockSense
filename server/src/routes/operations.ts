import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { stockEngine, InsufficientStockError, InvalidStatusError } from "../lib/stockEngine";
import { createOperationSchema, updateOperationSchema } from "@stocksense/shared";

const prisma = new PrismaClient();
const router = Router();

// GET all operations
router.get("/", async (req, res, next) => {
  try {
    const { type, status } = req.query;
    
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    
    const operations = await prisma.operation.findMany({
      where,
      include: {
        contact: true,
        sourceLocation: true,
        destLocation: true,
        lines: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(operations);
  } catch (error) {
    next(error);
  }
});

// GET single operation
router.get("/:id", async (req, res, next) => {
  try {
    const operation = await prisma.operation.findUnique({
      where: { id: req.params.id },
      include: {
        contact: true,
        sourceLocation: true,
        destLocation: true,
        lines: {
          include: { product: true }
        }
      }
    });
    
    if (!operation) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Operation not found' } });
    }
    
    res.json(operation);
  } catch (error) {
    next(error);
  }
});

// POST create operation
router.post("/", async (req, res, next) => {
  try {
    const data = createOperationSchema.parse(req.body);
    
    const op = await stockEngine.createOperation(data, (req as any).user?.id);
    
    // Auto validate ADJUSTMENT if requested (like inline stock edit)
    if (data.type === 'ADJUSTMENT' && data.operationTypeNote === 'Inline stock adjustment') {
      await stockEngine.validateOperation(op.id, (req as any).user?.id);
      const updatedOp = await prisma.operation.findUnique({ where: { id: op.id } });
      return res.status(201).json(updatedOp);
    }
    
    res.status(201).json(op);
  } catch (error) {
    next(error);
  }
});

// POST confirm operation
router.post("/:id/confirm", async (req, res, next) => {
  try {
    const op = await stockEngine.confirmOperation(req.params.id);
    res.json(op);
  } catch (error: any) {
    if (error instanceof InvalidStatusError) {
      return res.status(400).json({ error: { code: 'INVALID_STATUS', message: error.message } });
    }
    if (error instanceof InsufficientStockError) {
      return res.status(409).json({ error: { code: 'INSUFFICIENT_STOCK', message: error.message } });
    }
    next(error);
  }
});

// POST validate operation
router.post("/:id/validate", async (req, res, next) => {
  try {
    // Some operations might need to update lines with `countedQuantity` before validation.
    // In this simple implementation, we assume `countedQuantity` was already saved if needed.
    const op = await stockEngine.validateOperation(req.params.id, (req as any).user?.id);
    res.json(op);
  } catch (error: any) {
    if (error instanceof InvalidStatusError) {
      return res.status(400).json({ error: { code: 'INVALID_STATUS', message: error.message } });
    }
    if (error instanceof InsufficientStockError) {
      return res.status(409).json({ error: { code: 'INSUFFICIENT_STOCK', message: error.message } });
    }
    next(error);
  }
});

// POST cancel operation
router.post("/:id/cancel", async (req, res, next) => {
  try {
    const op = await stockEngine.cancelOperation(req.params.id);
    res.json(op);
  } catch (error: any) {
    if (error instanceof InvalidStatusError) {
      return res.status(400).json({ error: { code: 'INVALID_STATUS', message: error.message } });
    }
    next(error);
  }
});

export const operationsRouter = router;
