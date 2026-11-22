import type { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: z.flattenError(err).fieldErrors });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
