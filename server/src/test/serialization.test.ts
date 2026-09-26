import { describe, it, expect } from 'vitest';
import { prisma } from '../db/prisma.js';
import { serialize } from '../lib/serialize.js';
import { Decimal } from '@prisma/client/runtime/library';

describe('Serialization', () => {
  it('converts Prisma Decimal and Date to JS primitives', () => {
    const date = new Date('2026-09-26T10:00:00Z');
    
    const dbRecord = {
      id: 'prod-1',
      name: 'Test Product',
      unitCost: new Decimal('150.50'),
      quantity: new Decimal('10.123'),
      createdAt: date,
      nested: {
        cost: new Decimal('99.99'),
      },
      tags: ['a', 'b'],
    };

    const serialized = serialize(dbRecord) as any;

    expect(serialized.unitCost).toBe(150.5);
    expect(typeof serialized.unitCost).toBe('number');
    
    expect(serialized.quantity).toBe(10.123);
    expect(typeof serialized.quantity).toBe('number');

    expect(serialized.createdAt).toBe(date.toISOString());
    expect(typeof serialized.createdAt).toBe('string');

    expect(serialized.nested.cost).toBe(99.99);
    
    expect(serialized.tags).toEqual(['a', 'b']);
  });
});
