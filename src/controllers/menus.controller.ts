import { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { menus, profiles, completedMeals, gamification, pointsLog } from '../../drizzle/schema.js';
import { menuGenerateSchema, completeMealSchema } from '../middleware/validation.middleware.js';
import { AuthRequest } from '../types/index.js';
import { generateMenu } from '../services/skinchef.service.js';
import { eq, desc, and } from 'drizzle-orm';

export async function generate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const data = menuGenerateSchema.parse(req.body);
    
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    
    if (!profile) {
      return res.status(400).json({ error: 'Primero crea tu perfil alimentario' });
    }
    
    const menuData = await generateMenu({
      userId,
      budget: data.preferences?.budget || profile.budgetWeekly || 50,
      diners: data.preferences?.diners || profile.diners || 2,
      mealsPerDay: profile.mealsPerDay || 3,
      daysPerWeek: profile.daysPerWeek || 7,
      dietType: data.preferences?.dietType || profile.dietType || 'omnivora',
      allergies: profile.allergies || [],
      dislikes: profile.dislikes || [],
      pantryItems: profile.pantryItems || []
    });
    
    await db.update(menus).set({ isActive: false }).where(eq(menus.userId, userId));
    
    const weekStart = data.weekStart ? new Date(data.weekStart) : new Date();
    
    const [menu] = await db.insert(menus).values({
      userId,
      weekStart,
      menuData: menuData.days,
      shoppingList: menuData.shoppingList,
      isActive: true
    }).returning();
    
    await addPoints(userId, 10, 'menu_generated');
    
    res.status(201).json(menu);
  } catch (error) {
    next(error);
  }
}

export async function getActive(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    
    const [menu] = await db.select()
      .from(menus)
      .where(and(eq(menus.userId, userId), eq(menus.isActive, true)))
      .orderBy(desc(menus.createdAt))
      .limit(1);
    
    if (!menu) {
      return res.status(404).json({ error: 'No hay menú activo' });
    }
    
    res.json(menu);
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const menuList = await db.select({
      id: menus.id,
      weekStart: menus.weekStart,
      isActive: menus.isActive,
      createdAt: menus.createdAt
    })
    .from(menus)
    .where(eq(menus.userId, userId))
    .orderBy(desc(menus.createdAt))
    .limit(limit)
    .offset(offset);
    
    res.json({ menus: menuList });
  } catch (error) {
    next(error);
  }
}

export async function completeMeal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const data = completeMealSchema.parse(req.body);
    
    const [completed] = await db.insert(completedMeals).values({
      userId,
      menuId: data.menuId,
      dayIndex: data.dayIndex,
      mealType: data.mealType,
      rating: data.rating,
      notes: data.notes
    }).returning();
    
    await addPoints(userId, 5, 'meal_completed');
    await updateStreak(userId);
    
    res.status(201).json(completed);
  } catch (error) {
    next(error);
  }
}

async function addPoints(userId: number, points: number, reason: string) {
  await db.insert(pointsLog).values({ userId, points, reason });
  
  const [stats] = await db.select().from(gamification).where(eq(gamification.userId, userId));
  
  if (stats) {
    const newPoints = (stats.points || 0) + points;
    const newLevel = Math.floor(newPoints / 100) + 1;
    
    await db.update(gamification)
      .set({ points: newPoints, level: newLevel })
      .where(eq(gamification.userId, userId));
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
    
    if (diffDays === 1) {
      const newStreak = (stats.streak || 0) + 1;
      const longestStreak = Math.max(newStreak, stats.longestStreak || 0);
      await db.update(gamification)
        .set({ streak: newStreak, longestStreak, lastActiveDate: today })
        .where(eq(gamification.userId, userId));
    } else if (diffDays > 1) {
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
