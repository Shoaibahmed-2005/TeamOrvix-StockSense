import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const locations = await prisma.location.findMany({
      include: { parent: true, warehouse: true },
      orderBy: { name: 'asc' }
    });
    res.json(locations);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, type, warehouseId, parentId } = req.body;
    const location = await prisma.location.create({
      data: { name, type, warehouseId, parentId }
    });
    res.status(201).json(location);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { name, type, warehouseId, parentId } = req.body;
    const location = await prisma.location.update({
      where: { id: req.params.id },
      data: { name, type, warehouseId, parentId }
    });
    res.json(location);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.location.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const locationsRouter = router;
