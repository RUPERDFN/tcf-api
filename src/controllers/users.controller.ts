import { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { users, profiles, menus, gamification, completedMeals, shoppingItems, pointsLog, passwordResetTokens, userMetrics } from '../../drizzle/schema.js';
import { profileSchema, deleteAccountSchema } from '../middleware/validation.middleware.js';
import { AuthRequest } from '../types/index.js';
import { eq, count, sql } from 'drizzle-orm';

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
    const [metrics] = await db.select().from(userMetrics).where(eq(userMetrics.userId, userId));

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
      streak_days: stats?.streak || 0,
      ai_metrics: {
        waste_reduction_score: metrics?.wasteReductionScore || 0,
        preferences_tracked: metrics?.preferenceScore ? Object.keys(metrics.preferenceScore).length : 0
      }
    });
  } catch (error) {
    next(error);
  }
}

// AI Core: Vector Preference Tracker
export async function updatePreferenceScore(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { element, weight, type } = req.body; // type = 'ingredient' | 'cuisine_type' | 'diet', weight = 1 (like) or -1 (dislike)

    if (!element || typeof weight !== 'number') {
      return res.status(400).json({ error: 'element and weight are required.' });
    }

    const [metrics] = await db.select().from(userMetrics).where(eq(userMetrics.userId, userId));

    if (!metrics) {
      return res.status(404).json({ error: 'User metrics not initialized' });
    }

    // Logic to update the preference vector block
    let currentVector: Record<string, number> = metrics.preferenceScore as Record<string, number> || {};

    // Smooth the vector change: previous value + incoming weight (can decay over time in a real ML model)
    const keyName = `${type}:${element}`;
    const currentValue = currentVector[keyName] || 0;
    currentVector[keyName] = currentValue + weight;

    // Optional: cap values between -5 and 5 to prevent extreme polarization
    currentVector[keyName] = Math.max(-5, Math.min(5, currentVector[keyName]));

    const [updated] = await db.update(userMetrics)
      .set({
        preferenceScore: currentVector,
        updatedAt: new Date()
      })
      .where(eq(userMetrics.userId, userId))
      .returning();

    res.json({ success: true, new_vector: updated.preferenceScore });
  } catch (error) {
    next(error);
  }
}

// AI Core: Waste Reduction Gamification
export async function updateWasteReductionScore(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    // Assuming 'grams_saved' is sent by the fridge inventory scanner
    const { grams_saved } = req.body;

    if (typeof grams_saved !== 'number' || grams_saved <= 0) {
      return res.status(400).json({ error: 'A positive grams_saved value is required.' });
    }

    const [updated] = await db.update(userMetrics)
      .set({
        // Convert to Kg for the score
        wasteReductionScore: sql`${userMetrics.wasteReductionScore} + ${grams_saved / 1000}`,
        updatedAt: new Date()
      })
      .where(eq(userMetrics.userId, userId))
      .returning();

    res.json({
      success: true,
      total_waste_reduced_kg: updated.wasteReductionScore,
      message: `¡Impresionante! Has salvado ${grams_saved}g de comida de acabar en la basura.`
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
