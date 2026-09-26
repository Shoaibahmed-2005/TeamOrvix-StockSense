import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Virtual locations (no warehouse) ──────────────────────────────────────
  const vendorLoc = await prisma.location.upsert({
    where: { id: 'loc-vendor' },
    update: {},
    create: {
      id: 'loc-vendor',
      name: 'Vendor',
      shortCode: 'VENDOR',
      type: 'VENDOR',
    },
  });

  const customerLoc = await prisma.location.upsert({
    where: { id: 'loc-customer' },
    update: {},
    create: {
      id: 'loc-customer',
      name: 'Customer',
      shortCode: 'CUSTOMER',
      type: 'CUSTOMER',
    },
  });

  const adjustLoc = await prisma.location.upsert({
    where: { id: 'loc-adjustment' },
    update: {},
    create: {
      id: 'loc-adjustment',
      name: 'Inventory Adjustment',
      shortCode: 'ADJ',
      type: 'ADJUSTMENT',
    },
  });

  console.log('✅ Virtual locations created');

  // ─── Warehouses ────────────────────────────────────────────────────────────
  const wh1 = await prisma.warehouse.upsert({
    where: { shortCode: 'WH' },
    update: {},
    create: {
      id: 'wh-main',
      name: 'Main Warehouse',
      shortCode: 'WH',
      address: 'Chennai, Tamil Nadu, India',
    },
  });

  const wh2 = await prisma.warehouse.upsert({
    where: { shortCode: 'WH2' },
    update: {},
    create: {
      id: 'wh-2',
      name: 'Warehouse 2',
      shortCode: 'WH2',
      address: 'Bengaluru, Karnataka, India',
    },
  });

  // ─── Warehouse 1 Locations ─────────────────────────────────────────────────
  const stock1 = await prisma.location.upsert({
    where: { id: 'loc-wh-stock1' },
    update: {},
    create: {
      id: 'loc-wh-stock1',
      name: 'Stock1',
      shortCode: 'Stock1',
      warehouseId: wh1.id,
      type: 'INTERNAL',
    },
  });

  const stock2 = await prisma.location.upsert({
    where: { id: 'loc-wh-stock2' },
    update: {},
    create: {
      id: 'loc-wh-stock2',
      name: 'Stock2',
      shortCode: 'Stock2',
      warehouseId: wh1.id,
      type: 'INTERNAL',
    },
  });

  const rackA = await prisma.location.upsert({
    where: { id: 'loc-wh-racka' },
    update: {},
    create: {
      id: 'loc-wh-racka',
      name: 'Rack A',
      shortCode: 'RackA',
      warehouseId: wh1.id,
      type: 'INTERNAL',
    },
  });

  const rackB = await prisma.location.upsert({
    where: { id: 'loc-wh-rackb' },
    update: {},
    create: {
      id: 'loc-wh-rackb',
      name: 'Rack B',
      shortCode: 'RackB',
      warehouseId: wh1.id,
      type: 'INTERNAL',
    },
  });

  const prodFloor = await prisma.location.upsert({
    where: { id: 'loc-wh-prod' },
    update: {},
    create: {
      id: 'loc-wh-prod',
      name: 'Production Floor',
      shortCode: 'ProdFloor',
      warehouseId: wh1.id,
      type: 'INTERNAL',
    },
  });

  // ─── Warehouse 2 default Stock location ────────────────────────────────────
  const wh2Stock = await prisma.location.upsert({
    where: { id: 'loc-wh2-stock' },
    update: {},
    create: {
      id: 'loc-wh2-stock',
      name: 'Stock',
      shortCode: 'Stock',
      warehouseId: wh2.id,
      type: 'INTERNAL',
    },
  });

  console.log('✅ Warehouses and locations created');

  // ─── Sequences ─────────────────────────────────────────────────────────────
  for (const code of ['IN', 'OUT', 'INT', 'ADJ']) {
    await prisma.sequence.upsert({
      where: { warehouseId_operationCode: { warehouseId: wh1.id, operationCode: code } },
      update: {},
      create: { warehouseId: wh1.id, operationCode: code, nextNumber: 1 },
    });
    await prisma.sequence.upsert({
      where: { warehouseId_operationCode: { warehouseId: wh2.id, operationCode: code } },
      update: {},
      create: { warehouseId: wh2.id, operationCode: code, nextNumber: 1 },
    });
  }

  // ─── Users ─────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@1234', 10);
  const admin = await prisma.user.upsert({
    where: { loginId: 'admin01' },
    update: {},
    create: {
      id: 'user-admin01',
      loginId: 'admin01',
      email: 'admin@stocksense.app',
      passwordHash,
      fullName: 'Admin User',
      role: 'MANAGER',
    },
  });

  console.log('✅ User admin01 created (password: Admin@1234)');

  // ─── Contacts ──────────────────────────────────────────────────────────────
  const azure = await prisma.contact.upsert({
    where: { id: 'contact-azure' },
    update: {},
    create: {
      id: 'contact-azure',
      name: 'Azure Interior',
      email: 'azure@interior.com',
      phone: '+91 98765 43210',
      address: 'Mumbai, Maharashtra',
      type: 'BOTH',
    },
  });

  const steel = await prisma.contact.upsert({
    where: { id: 'contact-steel' },
    update: {},
    create: {
      id: 'contact-steel',
      name: 'Steel Corp',
      email: 'procurement@steelcorp.com',
      phone: '+91 91234 56789',
      address: 'Kolkata, West Bengal',
      type: 'VENDOR',
    },
  });

  const gemini = await prisma.contact.upsert({
    where: { id: 'contact-gemini' },
    update: {},
    create: {
      id: 'contact-gemini',
      name: 'Gemini Furniture',
      email: 'orders@geminifurniture.com',
      phone: '+91 80123 45678',
      address: 'Hyderabad, Telangana',
      type: 'CUSTOMER',
    },
  });

  console.log('✅ Contacts created');

  // ─── Categories ────────────────────────────────────────────────────────────
  const furnitureCat = await prisma.category.upsert({
    where: { name: 'Furniture' },
    update: {},
    create: { id: 'cat-furniture', name: 'Furniture' },
  });

  const rawMatCat = await prisma.category.upsert({
    where: { name: 'Raw Material' },
    update: {},
    create: { id: 'cat-rawmat', name: 'Raw Material' },
  });

  const officeSupCat = await prisma.category.upsert({
    where: { name: 'Office Supplies' },
    update: {},
    create: { id: 'cat-officesup', name: 'Office Supplies' },
  });

  console.log('✅ Categories created');

  // ─── Products ──────────────────────────────────────────────────────────────
  const desk = await prisma.product.upsert({
    where: { sku: 'DESK001' },
    update: {},
    create: {
      id: 'prod-desk',
      name: 'Desk',
      sku: 'DESK001',
      categoryId: furnitureCat.id,
      uom: 'Units',
      unitCost: 3000,
    },
  });

  const table = await prisma.product.upsert({
    where: { sku: 'TABLE001' },
    update: {},
    create: {
      id: 'prod-table',
      name: 'Table',
      sku: 'TABLE001',
      categoryId: furnitureCat.id,
      uom: 'Units',
      unitCost: 3000,
    },
  });

  const chair = await prisma.product.upsert({
    where: { sku: 'CHAIR001' },
    update: {},
    create: {
      id: 'prod-chair',
      name: 'Chair',
      sku: 'CHAIR001',
      categoryId: furnitureCat.id,
      uom: 'Units',
      unitCost: 1200,
    },
  });

  const steelRods = await prisma.product.upsert({
    where: { sku: 'STEEL001' },
    update: {},
    create: {
      id: 'prod-steel',
      name: 'Steel Rods',
      sku: 'STEEL001',
      categoryId: rawMatCat.id,
      uom: 'kg',
      unitCost: 85,
    },
  });

  console.log('✅ Products created');

  // ─── Reorder rules ─────────────────────────────────────────────────────────
  await prisma.reorderRule.upsert({
    where: { productId_warehouseId: { productId: desk.id, warehouseId: wh1.id } },
    update: {},
    create: { productId: desk.id, warehouseId: wh1.id, minQty: 10, maxQty: 100 },
  });
  await prisma.reorderRule.upsert({
    where: { productId_warehouseId: { productId: chair.id, warehouseId: wh1.id } },
    update: {},
    create: { productId: chair.id, warehouseId: wh1.id, minQty: 5, maxQty: 50 },
  });

  // ─── Initial stock (Desk 50, Table 50 in Stock1) ───────────────────────────
  await prisma.stockQuant.upsert({
    where: { productId_locationId: { productId: desk.id, locationId: stock1.id } },
    update: { quantity: 50 },
    create: { productId: desk.id, locationId: stock1.id, quantity: 50 },
  });

  await prisma.stockQuant.upsert({
    where: { productId_locationId: { productId: table.id, locationId: stock1.id } },
    update: { quantity: 50 },
    create: { productId: table.id, locationId: stock1.id, quantity: 50 },
  });

  // Chair: low stock (3, min is 5) so dashboard shows low stock
  await prisma.stockQuant.upsert({
    where: { productId_locationId: { productId: chair.id, locationId: stock1.id } },
    update: { quantity: 3 },
    create: { productId: chair.id, locationId: stock1.id, quantity: 3 },
  });

  // Steel rods: 0 (out of stock)
  await prisma.stockQuant.upsert({
    where: { productId_locationId: { productId: steelRods.id, locationId: stock1.id } },
    update: { quantity: 0 },
    create: { productId: steelRods.id, locationId: stock1.id, quantity: 0 },
  });

  console.log('✅ Stock quants seeded');

  // ─── Seed stock moves for initial stock ────────────────────────────────────
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 86400000);

  // ─── DONE receipt (Desk + Table received) ─────────────────────────────────
  const receiptDone = await prisma.operation.upsert({
    where: { reference: 'WH/IN/0001' },
    update: {},
    create: {
      id: 'op-receipt-done',
      reference: 'WH/IN/0001',
      type: 'RECEIPT',
      status: 'DONE',
      warehouseId: wh1.id,
      sourceLocationId: vendorLoc.id,
      destLocationId: stock1.id,
      contactId: azure.id,
      scheduleDate: fiveDaysAgo,
      responsibleId: admin.id,
      doneAt: fiveDaysAgo,
    },
  });

  await prisma.operationLine.createMany({
    data: [
      { operationId: receiptDone.id, productId: desk.id, quantity: 50 },
      { operationId: receiptDone.id, productId: table.id, quantity: 50 },
    ],
    skipDuplicates: true,
  });

  await prisma.stockMove.createMany({
    data: [
      {
        operationId: receiptDone.id,
        reference: receiptDone.reference,
        productId: desk.id,
        fromLocationId: vendorLoc.id,
        toLocationId: stock1.id,
        quantity: 50,
        contactId: azure.id,
        direction: 'IN',
        status: 'DONE',
        date: fiveDaysAgo,
        userId: admin.id,
      },
      {
        operationId: receiptDone.id,
        reference: receiptDone.reference,
        productId: table.id,
        fromLocationId: vendorLoc.id,
        toLocationId: stock1.id,
        quantity: 50,
        contactId: azure.id,
        direction: 'IN',
        status: 'DONE',
        date: fiveDaysAgo,
        userId: admin.id,
      },
    ],
    skipDuplicates: true,
  });

  // ─── DONE delivery (10 Desks out) ─────────────────────────────────────────
  const deliveryDone = await prisma.operation.upsert({
    where: { reference: 'WH/OUT/0001' },
    update: {},
    create: {
      id: 'op-delivery-done',
      reference: 'WH/OUT/0001',
      type: 'DELIVERY',
      status: 'DONE',
      warehouseId: wh1.id,
      sourceLocationId: stock1.id,
      destLocationId: customerLoc.id,
      contactId: gemini.id,
      deliveryAddress: 'Hyderabad, Telangana',
      scheduleDate: threeDaysAgo,
      responsibleId: admin.id,
      doneAt: threeDaysAgo,
    },
  });

  await prisma.operationLine.createMany({
    data: [{ operationId: deliveryDone.id, productId: desk.id, quantity: 10 }],
    skipDuplicates: true,
  });

  await prisma.stockMove.createMany({
    data: [
      {
        operationId: deliveryDone.id,
        reference: deliveryDone.reference,
        productId: desk.id,
        fromLocationId: stock1.id,
        toLocationId: customerLoc.id,
        quantity: 10,
        contactId: gemini.id,
        direction: 'OUT',
        status: 'DONE',
        date: threeDaysAgo,
        userId: admin.id,
      },
    ],
    skipDuplicates: true,
  });

  // ─── DRAFT receipt (pending) ───────────────────────────────────────────────
  const receiptDraft = await prisma.operation.upsert({
    where: { reference: 'WH/IN/0002' },
    update: {},
    create: {
      id: 'op-receipt-draft',
      reference: 'WH/IN/0002',
      type: 'RECEIPT',
      status: 'DRAFT',
      warehouseId: wh1.id,
      sourceLocationId: vendorLoc.id,
      destLocationId: stock1.id,
      contactId: steel.id,
      scheduleDate: new Date(now.getTime() + 2 * 86400000), // 2 days ahead
      responsibleId: admin.id,
    },
  });

  await prisma.operationLine.createMany({
    data: [{ operationId: receiptDraft.id, productId: steelRods.id, quantity: 100 }],
    skipDuplicates: true,
  });

  // ─── READY receipt (pending, schedule today) ───────────────────────────────
  const receiptReady = await prisma.operation.upsert({
    where: { reference: 'WH/IN/0003' },
    update: {},
    create: {
      id: 'op-receipt-ready',
      reference: 'WH/IN/0003',
      type: 'RECEIPT',
      status: 'READY',
      warehouseId: wh1.id,
      sourceLocationId: vendorLoc.id,
      destLocationId: stock1.id,
      contactId: azure.id,
      scheduleDate: now,
      responsibleId: admin.id,
    },
  });

  await prisma.operationLine.createMany({
    data: [{ operationId: receiptReady.id, productId: chair.id, quantity: 20 }],
    skipDuplicates: true,
  });

  // ─── LATE receipt (schedule date in the past, still DRAFT) ────────────────
  const receiptLate = await prisma.operation.upsert({
    where: { reference: 'WH/IN/0004' },
    update: {},
    create: {
      id: 'op-receipt-late',
      reference: 'WH/IN/0004',
      type: 'RECEIPT',
      status: 'DRAFT',
      warehouseId: wh1.id,
      sourceLocationId: vendorLoc.id,
      destLocationId: rackA.id,
      contactId: steel.id,
      scheduleDate: new Date(now.getTime() - 3 * 86400000), // 3 days ago = late
      responsibleId: admin.id,
    },
  });

  await prisma.operationLine.createMany({
    data: [{ operationId: receiptLate.id, productId: steelRods.id, quantity: 50 }],
    skipDuplicates: true,
  });

  // ─── WAITING delivery (not enough chair stock) ─────────────────────────────
  const deliveryWaiting = await prisma.operation.upsert({
    where: { reference: 'WH/OUT/0002' },
    update: {},
    create: {
      id: 'op-delivery-waiting',
      reference: 'WH/OUT/0002',
      type: 'DELIVERY',
      status: 'WAITING',
      warehouseId: wh1.id,
      sourceLocationId: stock1.id,
      destLocationId: customerLoc.id,
      contactId: gemini.id,
      deliveryAddress: 'Hyderabad, Telangana',
      scheduleDate: new Date(now.getTime() + 86400000), // 1 day ahead
      responsibleId: admin.id,
    },
  });

  await prisma.operationLine.createMany({
    data: [{ operationId: deliveryWaiting.id, productId: chair.id, quantity: 10 }],
    skipDuplicates: true,
  });

  // ─── DRAFT internal transfer ───────────────────────────────────────────────
  const internalDraft = await prisma.operation.upsert({
    where: { reference: 'WH/INT/0001' },
    update: {},
    create: {
      id: 'op-internal-draft',
      reference: 'WH/INT/0001',
      type: 'INTERNAL',
      status: 'DRAFT',
      warehouseId: wh1.id,
      sourceLocationId: stock1.id,
      destLocationId: rackB.id,
      scheduleDate: new Date(now.getTime() + 86400000),
      responsibleId: admin.id,
    },
  });

  await prisma.operationLine.createMany({
    data: [{ operationId: internalDraft.id, productId: table.id, quantity: 5 }],
    skipDuplicates: true,
  });

  // ─── Sequences — bump to next available numbers ───────────────────────────
  await prisma.sequence.updateMany({
    where: { warehouseId: wh1.id, operationCode: 'IN' },
    data: { nextNumber: 5 },
  });
  await prisma.sequence.updateMany({
    where: { warehouseId: wh1.id, operationCode: 'OUT' },
    data: { nextNumber: 3 },
  });
  await prisma.sequence.updateMany({
    where: { warehouseId: wh1.id, operationCode: 'INT' },
    data: { nextNumber: 2 },
  });

  console.log('✅ Operations and stock moves seeded');
  console.log('\n✨ Seed complete! Demo credentials:');
  console.log('   Login ID : admin01');
  console.log('   Password : Admin@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
