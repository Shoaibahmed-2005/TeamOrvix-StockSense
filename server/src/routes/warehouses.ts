import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(warehouses);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const warehouse = await prisma.warehouse.create({
      data: { name, code, companyId: "cm1p1q0r80000abc123456789" } // using seed companyId for simplicity
    });
    res.status(201).json(warehouse);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const warehouse = await prisma.warehouse.update({
      where: { id: req.params.id },
      data: { name, code }
    });
    res.json(warehouse);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.warehouse.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const warehousesRouter = router;
