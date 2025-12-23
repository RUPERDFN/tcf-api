import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface HealthResponse {
  ok: boolean;
  db: boolean;
  timestamp: string;
  env: string;
}

export interface ErrorResponse {
  error: string;
  details?: Array<{ field: string; message: string }>;
}
