import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signToken(payload: { userId: string; email: string }) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
}
