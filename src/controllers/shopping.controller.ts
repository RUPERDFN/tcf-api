import { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { shoppingItems, menus } from '../../drizzle/schema.js';
import { shoppingItemSchema, togglePurchasedSchema } from '../middleware/validation.middleware.js';
import { AuthRequest } from '../types/index.js';
import { eq, and, desc } from 'drizzle-orm';

export async function getList(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const menuId = req.query.menuId ? parseInt(req.query.menuId as string) : undefined;
    
    let query = db.select().from(shoppingItems).where(eq(shoppingItems.userId, userId));
    
    if (menuId) {
      query = db.select().from(shoppingItems).where(
        and(eq(shoppingItems.userId, userId), eq(shoppingItems.menuId, menuId))
      );
    }
    
    const items = await query;
    
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

export async function addItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const data = shoppingItemSchema.parse(req.body);
    const menuId = req.body.menuId ? parseInt(req.body.menuId) : undefined;
    
    const [item] = await db.insert(shoppingItems).values({
      userId,
      menuId,
      itemName: data.itemName,
      quantity: data.quantity,
      category: data.category
    }).returning();
    
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function togglePurchased(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.id);
    const data = togglePurchasedSchema.parse(req.body);
    
    const [updated] = await db.update(shoppingItems)
      .set({ 
        isPurchased: data.isPurchased,
        purchasedAt: data.isPurchased ? new Date() : null
      })
      .where(and(eq(shoppingItems.id, itemId), eq(shoppingItems.userId, userId)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.id);
    
    const [deleted] = await db.delete(shoppingItems)
      .where(and(eq(shoppingItems.id, itemId), eq(shoppingItems.userId, userId)))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function getFromActiveMenu(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    
    const [activeMenu] = await db.select()
      .from(menus)
      .where(and(eq(menus.userId, userId), eq(menus.isActive, true)))
      .orderBy(desc(menus.createdAt))
      .limit(1);
    
    if (!activeMenu) {
      return res.status(404).json({ error: 'No hay menú activo' });
    }
    
    res.json({ shoppingList: activeMenu.shoppingList || [] });
  } catch (error) {
    next(error);
  }
}
