import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone, type, address } = req.body;
    const contact = await prisma.contact.create({
      data: { name, email, phone, type, address, companyId: "cm1p1q0r80000abc123456789" }
    });
    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { name, email, phone, type, address } = req.body;
    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: { name, email, phone, type, address }
    });
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.contact.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const contactsRouter = router;
