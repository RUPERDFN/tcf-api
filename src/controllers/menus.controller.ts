import { Response, NextFunction } from 'express';
import { db, query } from '../config/database.js';
import { menus, profiles, completedMeals, gamification, pointsLog, shoppingItems } from '../../shared/schema.js';
import { menuGenerateSchema, completeMealSchema } from '../middleware/validation.middleware.js';
import { AuthRequest } from '../types/index.js';
import { generateMenu, swapMeal, getRecipe, MealItem, ShoppingItem } from '../services/skinchef.service.js';
import { eq, desc, and } from 'drizzle-orm';

export async function generate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const data = menuGenerateSchema.parse(req.body);
    
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    
    if (!profile) {
      return res.status(400).json({ error: 'Primero crea tu perfil alimentario' });
    }
    
    const days = (req.body.days as number) || profile.daysPerWeek || 7;
    
    const menuData = await generateMenu({
      userId,
      budget: data.preferences?.budget || profile.budgetWeekly || 50,
      diners: data.preferences?.diners || profile.diners || 2,
      mealsPerDay: profile.mealsPerDay || 3,
      daysPerWeek: days,
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
    
    if (menuData.shoppingList && menuData.shoppingList.length > 0) {
      for (const item of menuData.shoppingList) {
        await db.insert(shoppingItems).values({
          userId,
          menuId: menu.id,
          itemName: item.name,
          quantity: item.quantity,
          category: item.category,
          isPurchased: false
        });
      }
    }
    
    await addPointsAtomic(userId, 50, 'menu_generated');
    
    res.status(201).json({
      menu: {
        id: menu.id,
        weekStart: menu.weekStart,
        menuData: menu.menuData,
        isActive: menu.isActive,
        createdAt: menu.createdAt
      },
      shoppingList: menu.shoppingList
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrent(req: AuthRequest, res: Response, next: NextFunction) {
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
    
    const completed = await db.select()
      .from(completedMeals)
      .where(eq(completedMeals.menuId, menu.id));
    
    const items = await db.select()
      .from(shoppingItems)
      .where(eq(shoppingItems.menuId, menu.id));
    
    res.json({
      menu: {
        id: menu.id,
        weekStart: menu.weekStart,
        menuData: menu.menuData,
        isActive: menu.isActive,
        createdAt: menu.createdAt
      },
      shoppingList: items,
      completedMeals: completed
    });
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

export async function swap(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const menuId = parseInt(req.params.menuId);
    const { dayIndex, mealType, constraints } = req.body;
    
    if (dayIndex === undefined || !mealType) {
      return res.status(400).json({ error: 'dayIndex y mealType son requeridos' });
    }
    
    const [menu] = await db.select()
      .from(menus)
      .where(and(eq(menus.id, menuId), eq(menus.userId, userId)));
    
    if (!menu) {
      return res.status(404).json({ error: 'Menú no encontrado' });
    }
    
    const menuData = menu.menuData as any[];
    const day = menuData[dayIndex];
    
    if (!day || !day.meals || !day.meals[mealType]) {
      return res.status(400).json({ error: 'Comida no encontrada en el menú' });
    }
    
    const currentMeal = day.meals[mealType] as MealItem;
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    
    const result = await swapMeal(currentMeal, {
      dietType: constraints?.dietType || profile?.dietType,
      allergies: profile?.allergies || [],
      dislikes: profile?.dislikes || []
    });
    
    menuData[dayIndex].meals[mealType] = result.meal;
    
    let shoppingList = (menu.shoppingList || []) as ShoppingItem[];
    
    for (const item of result.shoppingListChanges.removed) {
      await db.delete(shoppingItems)
        .where(and(
          eq(shoppingItems.menuId, menuId), 
          eq(shoppingItems.itemName, item.name),
          eq(shoppingItems.category, item.category || '')
        ));
    }
    
    for (const item of result.shoppingListChanges.added) {
      const existingItem = await db.select()
        .from(shoppingItems)
        .where(and(
          eq(shoppingItems.menuId, menuId), 
          eq(shoppingItems.itemName, item.name),
          eq(shoppingItems.category, item.category || '')
        ))
        .limit(1);
      
      if (existingItem.length > 0) {
        await db.update(shoppingItems)
          .set({ quantity: item.quantity })
          .where(and(
            eq(shoppingItems.menuId, menuId), 
            eq(shoppingItems.itemName, item.name),
            eq(shoppingItems.category, item.category || '')
          ));
      } else {
        await db.insert(shoppingItems).values({
          userId,
          menuId,
          itemName: item.name,
          quantity: item.quantity,
          category: item.category || '',
          isPurchased: false
        });
      }
    }
    
    const updatedItems = await db.select()
      .from(shoppingItems)
      .where(eq(shoppingItems.menuId, menuId));
    
    const updatedShoppingList = updatedItems.map(item => ({
      name: item.itemName,
      quantity: item.quantity || '',
      category: item.category || ''
    }));
    
    await db.update(menus)
      .set({ menuData, shoppingList: updatedShoppingList })
      .where(eq(menus.id, menuId));
    
    res.json({
      menu: { id: menuId, menuData },
      shoppingList: updatedItems
    });
  } catch (error) {
    next(error);
  }
}

export async function completeMeal(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const menuId = parseInt(req.params.menuId);
    const data = completeMealSchema.parse({ ...req.body, menuId });
    
    const [menu] = await db.select()
      .from(menus)
      .where(and(eq(menus.id, menuId), eq(menus.userId, userId)));
    
    if (!menu) {
      return res.status(404).json({ error: 'Menú no encontrado' });
    }
    
    const existing = await db.select()
      .from(completedMeals)
      .where(and(
        eq(completedMeals.menuId, menuId),
        eq(completedMeals.dayIndex, data.dayIndex),
        eq(completedMeals.mealType, data.mealType)
      ));
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Esta comida ya fue completada' });
    }
    
    await db.insert(completedMeals).values({
      userId,
      menuId: data.menuId,
      dayIndex: data.dayIndex,
      mealType: data.mealType,
      rating: data.rating,
      notes: data.notes
    });
    
    let totalPoints = 10;
    const badges: string[] = [];
    
    await addPointsAtomic(userId, 10, 'meal_completed');
    
    const allCompleted = await db.select()
      .from(completedMeals)
      .where(eq(completedMeals.menuId, menuId));
    
    const mealsThisDay = allCompleted.filter(m => m.dayIndex === data.dayIndex);
    const menuData = menu.menuData as any[];
    const dayMeals = menuData[data.dayIndex]?.meals || {};
    const totalMealsInDay = Object.keys(dayMeals).length;
    
    if (mealsThisDay.length === totalMealsInDay && totalMealsInDay > 0) {
      await addPointsAtomic(userId, 25, 'day_completed');
      totalPoints += 25;
      badges.push('day_completed');
    }
    
    const totalMealsInMenu = menuData.reduce((sum: number, day: any) => {
      return sum + (day.meals ? Object.keys(day.meals).length : 0);
    }, 0);
    
    if (allCompleted.length === totalMealsInMenu && totalMealsInMenu > 0) {
      await addPointsAtomic(userId, 100, 'week_completed');
      totalPoints += 100;
      badges.push('week_completed');
    }
    
    await updateStreak(userId);
    
    const [freshStats] = await db.select().from(gamification).where(eq(gamification.userId, userId));
    
    res.status(201).json({
      points: totalPoints,
      totalPoints: freshStats?.points || 0,
      level: freshStats?.level || 1,
      streak: freshStats?.streak || 0,
      badges
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecipeEndpoint(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const menuId = parseInt(req.params.menuId);
    const dayIndex = parseInt(req.params.dayIndex);
    const mealType = req.params.mealType;
    
    const [menu] = await db.select()
      .from(menus)
      .where(and(eq(menus.id, menuId), eq(menus.userId, userId)));
    
    if (!menu) {
      return res.status(404).json({ error: 'Menú no encontrado' });
    }
    
    const menuData = menu.menuData as any[];
    const day = menuData[dayIndex];
    
    if (!day || !day.meals || !day.meals[mealType]) {
      return res.status(404).json({ error: 'Comida no encontrada' });
    }
    
    const meal = day.meals[mealType] as MealItem;
    
    const recipe = await getRecipe(meal.name);
    
    res.json({ recipe });
  } catch (error) {
    next(error);
  }
}

async function addPointsAtomic(userId: number, points: number, reason: string) {
  await db.insert(pointsLog).values({ userId, points, reason });
  
  await query(
    `INSERT INTO gamification (user_id, points, level, streak, longest_streak, badges)
     VALUES ($2, $1, FLOOR($1 / 100) + 1, 1, 0, '[]')
     ON CONFLICT (user_id) 
     DO UPDATE SET 
       points = COALESCE(gamification.points, 0) + $1, 
       level = FLOOR((COALESCE(gamification.points, 0) + $1) / 100) + 1`,
    [points, userId]
  );
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
