import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// GET all moves
router.get("/", async (req, res, next) => {
  try {
    const moves = await prisma.stockMove.findMany({
      include: {
        product: true,
        fromLocation: true,
        toLocation: true,
        contact: true,
        user: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(moves);
  } catch (error) {
    next(error);
  }
});

export const movesRouter = router;
