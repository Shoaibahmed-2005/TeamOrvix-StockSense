import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Don't log ZodErrors as errors — they are expected client mistakes
  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.') || '_';
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    }
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields },
    });
    return;
  }

  // Prisma unique constraint violation
  if (err instanceof Error && (err as NodeJS.ErrnoException & { code?: string }).code === 'P2002') {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'A record with this value already exists' } });
    return;
  }

  // Prisma check constraint (insufficient stock etc)
  if (
    err instanceof Error &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  ) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'Conflict' } });
    return;
  }

  if (err instanceof Error && (err as any).code === 'INSUFFICIENT_STOCK') {
    res.status(409).json({ error: { code: 'INSUFFICIENT_STOCK', message: err.message } });
    return;
  }

  if (err instanceof Error) {
    // Only log unexpected errors
    console.error('[error]', err.message);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
    return;
  }

  console.error('[error] unknown', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
