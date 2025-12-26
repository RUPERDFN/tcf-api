import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../config/database.js';
import { env } from '../config/env.js';
import { users, profiles, gamification, pointsLog, passwordResetTokens } from '../../shared/schema.js';
import { registerSchema, loginSchema, resetPasswordSchema } from '../middleware/validation.middleware.js';
import { sendWelcomeEmail, sendEmail } from '../services/email.service.js';
import { AuthRequest } from '../types/index.js';
import { eq, and, gt, isNull } from 'drizzle-orm';

function signToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: '7d' });
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
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
    await db.insert(gamification).values({ userId: user.id, points: 100, level: 1 });
    await db.insert(pointsLog).values({ userId: user.id, points: 100, reason: 'welcome_bonus' });
    
    const token = signToken(user.id, user.email);
    
    await sendWelcomeEmail(user.email, user.name || undefined);
    
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error: any) {
    if (error.code === '23505' && error.constraint?.includes('email')) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }
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
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'Cuenta desactivada' });
    }
    
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, user.id));
    
    await updateStreak(user.id);
    
    const token = signToken(user.id, user.email);
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name, isPremium: user.isPremium },
      token
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response) {
  res.json({ success: true, message: 'Sesión cerrada' });
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }
    
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      return res.json({ success: true, message: 'Si el email existe, recibirás instrucciones' });
    }
    
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 3600000);
    
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: hashedToken,
      expiresAt
    });
    
    const resetLink = `${env.CORS_ORIGINS[0]}/reset-password?token=${rawToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Restablecer contraseña - TheCookFlow',
      html: `
        <h1>Restablecer contraseña</h1>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Este enlace expira en 1 hora.</p>
      `
    });
    
    res.json({ success: true, message: 'Si el email existe, recibirás instrucciones' });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const data = resetPasswordSchema.parse(req.body);
    
    const hashedToken = hashToken(data.token);
    
    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, hashedToken),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );
    
    if (!resetToken) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }
    
    const passwordHash = await bcrypt.hash(data.newPassword, env.BCRYPT_ROUNDS);
    
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, resetToken.userId));
    
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, resetToken.id));
    
    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    
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
    
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    const [stats] = await db.select().from(gamification).where(eq(gamification.userId, userId));
    
    res.json({
      user,
      profile: profile || null,
      gamification: stats || { points: 0, level: 1, streak: 0, badges: [] }
    });
  } catch (error) {
    next(error);
  }
}

async function updateStreak(userId: number) {
  const [stats] = await db.select().from(gamification).where(eq(gamification.userId, userId));
  
  if (!stats) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = stats.lastActiveDate ? new Date(stats.lastActiveDate) : null;
  
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return;
    } else if (diffDays === 1) {
      const newStreak = (stats.streak || 0) + 1;
      const longestStreak = Math.max(newStreak, stats.longestStreak || 0);
      await db.update(gamification)
        .set({ streak: newStreak, longestStreak, lastActiveDate: today })
        .where(eq(gamification.userId, userId));
    } else {
      await db.update(gamification)
        .set({ streak: 1, lastActiveDate: today })
        .where(eq(gamification.userId, userId));
    }
  } else {
    await db.update(gamification)
      .set({ streak: 1, lastActiveDate: today })
      .where(eq(gamification.userId, userId));
  }
}
