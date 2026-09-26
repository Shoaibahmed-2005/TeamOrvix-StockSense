import { PrismaClient, OperationType, OperationStatus, MoveDirection } from '@prisma/client';

const prisma = new PrismaClient();

export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientStockError';
  }
}

export class InvalidStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStatusError';
  }
}

/**
 * Generates the next sequence reference atomically.
 */
export async function getNextReference(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  warehouseId: string,
  operationCode: string
): Promise<string> {
  const code = operationCode.toUpperCase();
  const res = await tx.$queryRaw<any[]>`
    INSERT INTO sequences (id, warehouse_id, operation_code, next_number)
    VALUES (gen_random_uuid(), ${warehouseId}, ${code}, 2)
    ON CONFLICT (warehouse_id, operation_code)
    DO UPDATE SET next_number = sequences.next_number + 1
    RETURNING next_number;
  `;
  const nextNum = res[0].next_number;
  // Format: WH-CODE-0000X
  // Assuming warehouse has a short_code, we should get it
  const wh = await tx.warehouse.findUnique({ where: { id: warehouseId }, select: { shortCode: true } });
  const whCode = wh?.shortCode || 'WH';
  
  const numberStr = (nextNum - 1).toString().padStart(5, '0');
  return `${whCode}-${code}-${numberStr}`;
}

/**
 * Locks a stock quant row and returns it. If not found, creates it (with 0 quantity) and returns it.
 */
async function lockStockQuant(
  tx: any,
  productId: string,
  locationId: string
) {
  // Try to lock
  let quants = await tx.$queryRaw<any[]>`
    SELECT * FROM stock_quants 
    WHERE product_id = ${productId} AND location_id = ${locationId} 
    FOR UPDATE;
  `;
  
  if (quants.length === 0) {
    // Create it
    try {
      await tx.stockQuant.create({
        data: {
          productId,
          locationId,
          quantity: 0,
          reservedQuantity: 0
        }
      });
      quants = await tx.$queryRaw<any[]>`
        SELECT * FROM stock_quants 
        WHERE product_id = ${productId} AND location_id = ${locationId} 
        FOR UPDATE;
      `;
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Someone else created it just now, lock it again
        quants = await tx.$queryRaw<any[]>`
          SELECT * FROM stock_quants 
          WHERE product_id = ${productId} AND location_id = ${locationId} 
          FOR UPDATE;
        `;
      } else {
        throw e;
      }
    }
  }
  return quants[0];
}

/**
 * Updates stock quant. Adjusts quantity and/or reserved_quantity.
 */
async function updateStockQuant(
  tx: any,
  productId: string,
  locationId: string,
  qtyChange: number,
  reservedQtyChange: number = 0
) {
  if (qtyChange === 0 && reservedQtyChange === 0) return;
  
  const quant = await lockStockQuant(tx, productId, locationId);
  const newQty = Number(quant.quantity) + qtyChange;
  const newReserved = Number(quant.reserved_quantity) + reservedQtyChange;
  
  if (newQty < 0) {
    throw new InsufficientStockError(`Insufficient stock for product ${productId} at location ${locationId}`);
  }
  
  if (newQty < newReserved) {
    throw new InsufficientStockError(`Cannot reserve more than available stock for product ${productId} at location ${locationId}`);
  }
  
  await tx.$queryRaw`
    UPDATE stock_quants 
    SET quantity = ${newQty}, reserved_quantity = ${newReserved}
    WHERE id = ${quant.id};
  `;
}

/**
 * Operations Engine
 */
export const stockEngine = {
  createOperation: async (data: any, userId?: string) => {
    return await prisma.$transaction(async (tx) => {
      let opCode = '';
      if (data.type === 'RECEIPT') opCode = 'IN';
      else if (data.type === 'DELIVERY') opCode = 'OUT';
      else if (data.type === 'INTERNAL') opCode = 'INT';
      else if (data.type === 'ADJUSTMENT') opCode = 'ADJ';
      
      const reference = await getNextReference(tx, data.warehouseId, opCode);
      
      let status: OperationStatus = 'DRAFT';
      if (data.type === 'ADJUSTMENT') {
        // Adjustments are often validated immediately or start as DRAFT
        status = 'DRAFT'; 
      }
      
      const op = await tx.operation.create({
        data: {
          reference,
          type: data.type,
          status,
          warehouseId: data.warehouseId,
          sourceLocationId: data.sourceLocationId,
          destLocationId: data.destLocationId,
          contactId: data.contactId,
          deliveryAddress: data.deliveryAddress,
          operationTypeNote: data.operationTypeNote,
          scheduleDate: new Date(data.scheduleDate),
          responsibleId: data.responsibleId || userId,
          lines: {
            create: data.lines.map((l: any) => ({
              productId: l.productId,
              quantity: l.quantity,
              countedQuantity: l.countedQuantity
            }))
          }
        },
        include: { lines: true }
      });
      
      return op;
    });
  },

  confirmOperation: async (operationId: string) => {
    return await prisma.$transaction(async (tx) => {
      const op = await tx.operation.findUnique({
        where: { id: operationId },
        include: { lines: true }
      });
      
      if (!op) throw new Error("Operation not found");
      if (op.status !== 'DRAFT') throw new InvalidStatusError(`Cannot confirm operation from status ${op.status}`);
      
      if (op.type === 'RECEIPT') {
        // Receipts just move to READY
        return await tx.operation.update({
          where: { id: op.id },
          data: { status: 'READY' }
        });
      }
      
      if (op.type === 'DELIVERY' || op.type === 'INTERNAL') {
        if (!op.sourceLocationId) throw new Error("Source location required");
        
        let allAvailable = true;
        
        for (const line of op.lines) {
          const quant = await lockStockQuant(tx, line.productId, op.sourceLocationId);
          const available = Number(quant.quantity) - Number(quant.reserved_quantity);
          if (available < Number(line.quantity)) {
            allAvailable = false;
          }
        }
        
        if (allAvailable) {
          // Reserve stock
          for (const line of op.lines) {
            await updateStockQuant(tx, line.productId, op.sourceLocationId, 0, Number(line.quantity));
          }
          return await tx.operation.update({
            where: { id: op.id },
            data: { status: 'READY' }
          });
        } else {
          return await tx.operation.update({
            where: { id: op.id },
            data: { status: 'WAITING' }
          });
        }
      }
      
      if (op.type === 'ADJUSTMENT') {
         return await tx.operation.update({
          where: { id: op.id },
          data: { status: 'READY' }
        });
      }
    });
  },

  validateOperation: async (operationId: string, userId?: string) => {
    return await prisma.$transaction(async (tx) => {
      const op = await tx.operation.findUnique({
        where: { id: operationId },
        include: { lines: true, sourceLocation: true, destLocation: true }
      });
      
      if (!op) throw new Error("Operation not found");
      if (op.status === 'DONE' || op.status === 'CANCELLED') {
        throw new InvalidStatusError(`Cannot validate operation in status ${op.status}`);
      }
      
      // If it's a delivery or internal transfer that was READY, it means stock was reserved.
      const wasReserved = op.status === 'READY' && (op.type === 'DELIVERY' || op.type === 'INTERNAL');
      
      // Validate Moves
      for (const line of op.lines) {
        const qtyToMove = Number(line.countedQuantity ?? line.quantity);
        if (qtyToMove <= 0) continue; // Skip 0 quantity moves

        if (op.type === 'RECEIPT' && op.destLocationId) {
          await updateStockQuant(tx, line.productId, op.destLocationId, qtyToMove, 0);
          
          await tx.stockMove.create({
            data: {
              operationId: op.id,
              reference: op.reference,
              productId: line.productId,
              toLocationId: op.destLocationId,
              quantity: qtyToMove,
              contactId: op.contactId,
              direction: 'IN',
              userId
            }
          });
        } 
        else if (op.type === 'DELIVERY' && op.sourceLocationId) {
          // Subtract from source, release reservation if it was reserved
          const reservedRelease = wasReserved ? -qtyToMove : 0;
          await updateStockQuant(tx, line.productId, op.sourceLocationId, -qtyToMove, reservedRelease);
          
          await tx.stockMove.create({
            data: {
              operationId: op.id,
              reference: op.reference,
              productId: line.productId,
              fromLocationId: op.sourceLocationId,
              quantity: qtyToMove,
              contactId: op.contactId,
              direction: 'OUT',
              userId
            }
          });
        }
        else if (op.type === 'INTERNAL' && op.sourceLocationId && op.destLocationId) {
          const reservedRelease = wasReserved ? -qtyToMove : 0;
          await updateStockQuant(tx, line.productId, op.sourceLocationId, -qtyToMove, reservedRelease);
          await updateStockQuant(tx, line.productId, op.destLocationId, qtyToMove, 0);
          
          await tx.stockMove.create({
            data: {
              operationId: op.id,
              reference: op.reference,
              productId: line.productId,
              fromLocationId: op.sourceLocationId,
              toLocationId: op.destLocationId,
              quantity: qtyToMove,
              direction: 'INTERNAL',
              userId
            }
          });
        }
        else if (op.type === 'ADJUSTMENT' && op.destLocationId) {
          // For adjustment, countedQuantity is the absolute difference if it's an inline update,
          // Wait, in my stock list inline update, I sent `quantity` as difference and `countedQuantity` as the new absolute quantity.
          // But actually, adjustment can be + or -.
          // If the user's inline edit is newQty=10 and oldQty=15, the difference is -5.
          // Wait, the UI sent `Math.abs(editQty - s.quantity)` as quantity. But how do we know direction?
          // Let's refine Adjustment: 
          // If `countedQuantity` is provided, we use it as the TARGET absolute quantity.
          // If not, we just add `quantity`.
          let diff = qtyToMove;
          if (line.countedQuantity !== null) {
            const quant = await lockStockQuant(tx, line.productId, op.destLocationId);
            diff = Number(line.countedQuantity) - Number(quant.quantity);
          }
          
          if (diff !== 0) {
            await updateStockQuant(tx, line.productId, op.destLocationId, diff, 0);
            
            await tx.stockMove.create({
              data: {
                operationId: op.id,
                reference: op.reference,
                productId: line.productId,
                toLocationId: op.destLocationId,
                quantity: Math.abs(diff),
                direction: 'ADJUSTMENT',
                userId
              }
            });
          }
        }
      }
      
      return await tx.operation.update({
        where: { id: op.id },
        data: { 
          status: 'DONE',
          doneAt: new Date()
        }
      });
    });
  },

  cancelOperation: async (operationId: string) => {
    return await prisma.$transaction(async (tx) => {
      const op = await tx.operation.findUnique({
        where: { id: operationId },
        include: { lines: true }
      });
      
      if (!op) throw new Error("Operation not found");
      if (op.status === 'DONE') throw new InvalidStatusError("Cannot cancel DONE operation");
      if (op.status === 'CANCELLED') return op;
      
      // Release reservations if it was READY (and not Receipt/Adjustment which don't reserve)
      if (op.status === 'READY' && (op.type === 'DELIVERY' || op.type === 'INTERNAL')) {
        if (op.sourceLocationId) {
          for (const line of op.lines) {
             await updateStockQuant(tx, line.productId, op.sourceLocationId, 0, -Number(line.quantity));
          }
        }
      }
      
      return await tx.operation.update({
        where: { id: op.id },
        data: { status: 'CANCELLED' }
      });
    });
  }
};
