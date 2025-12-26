import { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { shoppingItems, menus, gamification, pointsLog } from '../../shared/schema.js';
import { shoppingItemSchema } from '../middleware/validation.middleware.js';
import { AuthRequest } from '../types/index.js';
import { getSubstitutions } from '../services/skinchef.service.js';
import { eq, and, desc } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

interface CategoryGroup {
  category: string;
  items: Array<{
    id: number;
    itemName: string;
    quantity: string | null;
    isPurchased: boolean;
    purchasedAt: Date | null;
  }>;
}

export async function getCurrent(req: AuthRequest, res: Response, next: NextFunction) {
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
    
    const items = await db.select()
      .from(shoppingItems)
      .where(eq(shoppingItems.menuId, activeMenu.id));
    
    const categoryMap = new Map<string, CategoryGroup>();
    
    for (const item of items) {
      const cat = item.category || 'Otros';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { category: cat, items: [] });
      }
      categoryMap.get(cat)!.items.push({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        isPurchased: item.isPurchased || false,
        purchasedAt: item.purchasedAt
      });
    }
    
    const categories = Array.from(categoryMap.values());
    const totalItems = items.length;
    const purchasedItems = items.filter(i => i.isPurchased).length;
    
    res.json({
      menuId: activeMenu.id,
      categories,
      totalItems,
      purchasedItems,
      estimatedCost: 0
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.itemId);
    
    const [item] = await db.select()
      .from(shoppingItems)
      .where(and(eq(shoppingItems.id, itemId), eq(shoppingItems.userId, userId)));
    
    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }
    
    const newPurchased = !item.isPurchased;
    const purchasedAt = newPurchased ? new Date() : null;
    
    const [updated] = await db.update(shoppingItems)
      .set({ isPurchased: newPurchased, purchasedAt })
      .where(eq(shoppingItems.id, itemId))
      .returning();
    
    res.json({ item: updated, purchasedAt });
  } catch (error) {
    next(error);
  }
}

export async function addItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const data = shoppingItemSchema.parse(req.body);
    
    const [activeMenu] = await db.select()
      .from(menus)
      .where(and(eq(menus.userId, userId), eq(menus.isActive, true)))
      .orderBy(desc(menus.createdAt))
      .limit(1);
    
    if (!activeMenu) {
      return res.status(404).json({ error: 'No hay menú activo para añadir items' });
    }
    
    const [item] = await db.insert(shoppingItems).values({
      userId,
      menuId: activeMenu.id,
      itemName: data.itemName,
      quantity: data.quantity,
      category: data.category || 'Otros',
      isPurchased: false
    }).returning();
    
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.itemId);
    
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

export async function getSubstitution(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { ingredient, reason } = req.body;
    
    if (!ingredient) {
      return res.status(400).json({ error: 'Ingrediente requerido' });
    }
    
    const substitutions = await getSubstitutions(ingredient, reason);
    
    res.json({ substitutions });
  } catch (error) {
    next(error);
  }
}

export async function awardSubstitutionPoints(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { isHealthy } = req.body;
    
    if (isHealthy) {
      await db.insert(pointsLog).values({ userId, points: 15, reason: 'healthy_substitution' });
      
      const [stats] = await db.select().from(gamification).where(eq(gamification.userId, userId));
      if (stats) {
        const newPoints = (stats.points || 0) + 15;
        const newLevel = Math.floor(newPoints / 100) + 1;
        await db.update(gamification)
          .set({ points: newPoints, level: newLevel })
          .where(eq(gamification.userId, userId));
      }
      
      return res.json({ pointsAwarded: 15, message: 'Puntos por elección saludable' });
    }
    
    res.json({ pointsAwarded: 0 });
  } catch (error) {
    next(error);
  }
}

export async function exportPdf(req: AuthRequest, res: Response, next: NextFunction) {
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
    
    const items = await db.select()
      .from(shoppingItems)
      .where(eq(shoppingItems.menuId, activeMenu.id));
    
    const categoryMap = new Map<string, typeof items>();
    for (const item of items) {
      const cat = item.category || 'Otros';
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(item);
    }
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="lista-compras.pdf"');
    
    doc.pipe(res);
    
    doc.fontSize(24).fillColor('#d97706').text('Lista de Compras', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#666666').text(
      `Semana del ${activeMenu.weekStart ? new Date(activeMenu.weekStart).toLocaleDateString('es-ES') : 'N/A'}`,
      { align: 'center' }
    );
    doc.moveDown(1.5);
    
    for (const [category, catItems] of categoryMap) {
      doc.fontSize(16).fillColor('#78350f').text(category);
      doc.moveDown(0.3);
      
      for (const item of catItems) {
        const checkbox = item.isPurchased ? '☑' : '☐';
        const itemText = item.quantity 
          ? `${checkbox} ${item.itemName} (${item.quantity})`
          : `${checkbox} ${item.itemName}`;
        
        doc.fontSize(12).fillColor(item.isPurchased ? '#888888' : '#333333').text(itemText);
      }
      doc.moveDown(1);
    }
    
    const total = items.length;
    const purchased = items.filter(i => i.isPurchased).length;
    doc.moveDown(1);
    doc.fontSize(12).fillColor('#333333').text(`Total: ${purchased}/${total} items completados`, { align: 'right' });
    
    doc.end();
  } catch (error) {
    next(error);
  }
}

export async function exportText(req: AuthRequest, res: Response, next: NextFunction) {
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
    
    const items = await db.select()
      .from(shoppingItems)
      .where(eq(shoppingItems.menuId, activeMenu.id));
    
    const categoryMap = new Map<string, typeof items>();
    for (const item of items) {
      const cat = item.category || 'Otros';
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(item);
    }
    
    let text = `LISTA DE COMPRAS - TheCookFlow\n`;
    text += `Semana del ${activeMenu.weekStart ? new Date(activeMenu.weekStart).toLocaleDateString('es-ES') : 'N/A'}\n`;
    text += `${'='.repeat(40)}\n\n`;
    
    for (const [category, catItems] of categoryMap) {
      text += `${category.toUpperCase()}\n${'-'.repeat(20)}\n`;
      for (const item of catItems) {
        const checkbox = item.isPurchased ? '[x]' : '[ ]';
        text += `${checkbox} ${item.itemName}`;
        if (item.quantity) text += ` (${item.quantity})`;
        text += `\n`;
      }
      text += `\n`;
    }
    
    const total = items.length;
    const purchased = items.filter(i => i.isPurchased).length;
    text += `${'='.repeat(40)}\n`;
    text += `Total: ${purchased}/${total} items completados\n`;
    
    res.json({ text });
  } catch (error) {
    next(error);
  }
}
