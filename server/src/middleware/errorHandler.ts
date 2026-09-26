import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    }
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields },
    });
    return;
  }

  if (err instanceof Error) {
    if ((err as NodeJS.ErrnoException).code === 'P2002') {
      res.status(409).json({ error: { code: 'CONFLICT', message: 'A record with this value already exists' } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
    return;
  }

  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
