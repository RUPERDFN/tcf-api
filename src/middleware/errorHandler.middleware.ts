import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

function getDbErrorCode(err: any): string | undefined {
  return err.code || err.cause?.code;
}

function getDbConstraint(err: any): string | undefined {
  return err.constraint || err.cause?.constraint;
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validación fallida',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }

  const dbCode = getDbErrorCode(err);
  const constraint = getDbConstraint(err);

  if (dbCode === '23505') {
    if (constraint?.includes('email')) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }
    return res.status(400).json({ error: 'Registro duplicado' });
  }

  if (dbCode === '23503') {
    return res.status(400).json({ error: 'Referencia inválida' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
}
