import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validación fallida',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }

  if (err.code === '23505') {
    return res.status(400).json({ error: 'Registro duplicado' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
}
