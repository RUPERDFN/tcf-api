import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { env } from '../config/env.js';
import { users, profiles, gamification } from '../../drizzle/schema.js';
import { registerSchema, loginSchema } from '../middleware/validation.middleware.js';
import { sendWelcomeEmail } from '../services/email.service.js';
import { eq } from 'drizzle-orm';

function signToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: '7d' });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);
    
    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
    
    const [user] = await db.insert(users).values({
      email: data.email,
      passwordHash,
      name: data.name
    }).returning();
    
    await db.insert(profiles).values({ userId: user.id });
    await db.insert(gamification).values({ userId: user.id });
    
    const token = signToken(user.id, user.email);
    
    await sendWelcomeEmail(user.email, user.name || undefined);
    
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    
    const [user] = await db.select().from(users).where(eq(users.email, data.email));
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const token = signToken(user.id, user.email);
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId;
    
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
      isPremium: users.isPremium,
      premiumUntil: users.premiumUntil,
      createdAt: users.createdAt
    }).from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
}
