import { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { gamification, pointsLog } from '../../drizzle/schema.js';
import { AuthRequest } from '../types/index.js';
import { eq, desc } from 'drizzle-orm';

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    
    const [stats] = await db.select().from(gamification).where(eq(gamification.userId, userId));
    
    if (!stats) {
      return res.json({
        points: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        badges: []
      });
    }
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function getPointsHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    const history = await db.select()
      .from(pointsLog)
      .where(eq(pointsLog.userId, userId))
      .orderBy(desc(pointsLog.createdAt))
      .limit(limit);
    
    res.json({ history });
  } catch (error) {
    next(error);
  }
}

export async function getLeaderboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const topUsers = await db.select({
      points: gamification.points,
      level: gamification.level,
      streak: gamification.streak
    })
    .from(gamification)
    .orderBy(desc(gamification.points))
    .limit(10);
    
    res.json({ leaderboard: topUsers });
  } catch (error) {
    next(error);
  }
}

export async function getBadges(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    
    const [stats] = await db.select({ badges: gamification.badges })
      .from(gamification)
      .where(eq(gamification.userId, userId));
    
    const allBadges = [
      { id: 'first_menu', name: 'Primer Menú', description: 'Genera tu primer menú', icon: '🎯' },
      { id: 'week_streak', name: 'Racha Semanal', description: '7 días seguidos', icon: '🔥' },
      { id: 'month_streak', name: 'Racha Mensual', description: '30 días seguidos', icon: '💫' },
      { id: 'chef_novato', name: 'Chef Novato', description: 'Completa 10 comidas', icon: '👨‍🍳' },
      { id: 'chef_experto', name: 'Chef Experto', description: 'Completa 100 comidas', icon: '⭐' },
      { id: 'ahorrador', name: 'Ahorrador', description: 'Ahorra 50€ en un mes', icon: '💰' }
    ];
    
    const earnedBadges = stats?.badges || [];
    
    res.json({
      badges: allBadges.map(badge => ({
        ...badge,
        earned: earnedBadges.includes(badge.id)
      }))
    });
  } catch (error) {
    next(error);
  }
}
