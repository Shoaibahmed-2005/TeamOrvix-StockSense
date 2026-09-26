import { Decimal } from '@prisma/client/runtime/library';

type Serializable =
  | null
  | undefined
  | string
  | number
  | boolean
  | Date
  | Decimal
  | Serializable[]
  | { [key: string]: Serializable };

/**
 * Recursively converts Prisma Decimal values to JS numbers and Date values
 * to ISO strings, so the client always receives plain JSON-serializable types.
 * All quantities and costs come out as numbers, never strings.
 */
export function serialize<T>(value: T): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Decimal) return value.toNumber();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, serialize(v)])
    );
  }
  return value;
}
