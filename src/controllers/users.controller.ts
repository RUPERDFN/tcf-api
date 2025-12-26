import { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { users, profiles } from '../../drizzle/schema.js';
import { profileSchema } from '../middleware/validation.middleware.js';
import { AuthRequest } from '../types/index.js';
import { eq } from 'drizzle-orm';

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
