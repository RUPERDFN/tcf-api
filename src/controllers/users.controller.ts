import { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { users, profiles, menus, gamification, completedMeals, shoppingItems, pointsLog, passwordResetTokens } from '../../drizzle/schema.js';
import { profileSchema, deleteAccountSchema } from '../middleware/validation.middleware.js';
import { AuthRequest } from '../types/index.js';
import { eq, count } from 'drizzle-orm';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    
    if (!profile) {
      return res.json({ exists: false });
    }
    
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const data = profileSchema.parse(req.body);
    
    const [existing] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    
    if (existing) {
      const [updated] = await db.update(profiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(profiles.userId, userId))
        .returning();
      return res.json(updated);
    }
    
    const [created] = await db.insert(profiles)
      .values({ userId, ...data })
      .returning();
    
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { name, avatarUrl } = req.body;
    
    const [updated] = await db.update(users)
      .set({ 
        name: name || undefined, 
        avatarUrl: avatarUrl || undefined,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl
      });
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    
    const [user] = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, userId));
    const [stats] = await db.select().from(gamification).where(eq(gamification.userId, userId));
    
    const [menuCount] = await db.select({ count: count() }).from(menus).where(eq(menus.userId, userId));
    const [mealCount] = await db.select({ count: count() }).from(completedMeals).where(eq(completedMeals.userId, userId));
    
    const levels = ['Novato', 'Aprendiz', 'Cocinero', 'Chef', 'Chef Experto', 'Master Chef'];
    const levelIndex = Math.min(Math.floor((stats?.points || 0) / 100), levels.length - 1);
    
    res.json({
      menus_generated: menuCount?.count || 0,
      recipes_completed: mealCount?.count || 0,
      points: stats?.points || 0,
      level: levels[levelIndex],
      member_since: user?.createdAt || new Date(),
      streak_days: stats?.streak || 0
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    
    deleteAccountSchema.parse(req.body);
    
    await db.delete(pointsLog).where(eq(pointsLog.userId, userId));
    await db.delete(completedMeals).where(eq(completedMeals.userId, userId));
    await db.delete(shoppingItems).where(eq(shoppingItems.userId, userId));
    await db.delete(menus).where(eq(menus.userId, userId));
    await db.delete(gamification).where(eq(gamification.userId, userId));
    await db.delete(profiles).where(eq(profiles.userId, userId));
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    
    res.json({ success: true, message: 'Cuenta eliminada correctamente' });
  } catch (error) {
    next(error);
  }
}
