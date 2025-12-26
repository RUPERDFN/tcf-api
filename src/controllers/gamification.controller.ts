import { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { gamification, pointsLog, users, BadgeEntry } from '../../shared/schema.js';
import { AuthRequest } from '../types/index.js';
import { eq, desc, gte, sql } from 'drizzle-orm';

const LEVELS = [
  { level: 1, name: 'Pinche', icon: '🥄', minPoints: 0 },
  { level: 2, name: 'Cocinero', icon: '🍳', minPoints: 500 },
  { level: 3, name: 'Chef', icon: '👨‍🍳', minPoints: 1500 },
  { level: 4, name: 'Chef Ejecutivo', icon: '⭐', minPoints: 3500 },
  { level: 5, name: 'Master Chef', icon: '👑', minPoints: 7000 },
];

const BADGES = [
  { id: 'first_week', name: 'Primera Semana', description: 'Completar tu primera semana', icon: '📅' },
  { id: 'balanced', name: 'Equilibrado', description: '7 días con menú equilibrado', icon: '⚖️' },
  { id: 'saver', name: 'Ahorrador', description: 'Menú bajo presupuesto', icon: '💰' },
  { id: 'eco_chef', name: 'Eco-Chef', description: 'Usar ingredientes de temporada', icon: '🌿' },
  { id: 'consistent_30', name: 'Consistente', description: 'Racha de 30 días', icon: '🔥' },
  { id: 'master', name: 'Masterchef', description: 'Llegar a nivel 5', icon: '👑' },
];

function getLevelInfo(points: number) {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.minPoints) {
      currentLevel = level;
    }
  }
  
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
  const pointsToNextLevel = nextLevel ? nextLevel.minPoints - points : 0;
  
  return {
    level: currentLevel.level,
    levelName: currentLevel.name,
    levelIcon: currentLevel.icon,
    pointsToNextLevel
  };
}

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    
    let [stats] = await db.select().from(gamification).where(eq(gamification.userId, userId));
    
    if (!stats) {
      [stats] = await db.insert(gamification).values({
        userId,
        points: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        badges: []
      }).returning();
    }
    
    const levelInfo = getLevelInfo(stats.points || 0);
    
    const recentPoints = await db.select()
      .from(pointsLog)
      .where(eq(pointsLog.userId, userId))
      .orderBy(desc(pointsLog.createdAt))
      .limit(10);
    
    res.json({
      points: stats.points || 0,
      level: levelInfo.level,
      levelName: levelInfo.levelName,
      levelIcon: levelInfo.levelIcon,
      pointsToNextLevel: levelInfo.pointsToNextLevel,
      streak: stats.streak || 0,
      longestStreak: stats.longestStreak || 0,
      badges: stats.badges || [],
      recentPoints: recentPoints.map(p => ({
        points: p.points,
        reason: p.reason,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function getLeaderboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const period = (req.query.period as string) || 'alltime';
    
    let dateFilter: Date | null = null;
    const now = new Date();
    
    if (period === 'week') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    let leaderboard;
    
    if (dateFilter) {
      const pointsByUser = await db
        .select({
          userId: pointsLog.userId,
          totalPoints: sql<number>`COALESCE(SUM(${pointsLog.points}), 0)`.as('total_points')
        })
        .from(pointsLog)
        .where(gte(pointsLog.createdAt, dateFilter))
        .groupBy(pointsLog.userId)
        .orderBy(sql`total_points DESC`)
        .limit(20);
      
      leaderboard = await Promise.all(pointsByUser.map(async (entry, index) => {
        const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, entry.userId));
        const levelInfo = getLevelInfo(Number(entry.totalPoints));
        return {
          rank: index + 1,
          userId: entry.userId,
          name: user?.name || 'Usuario',
          points: Number(entry.totalPoints),
          level: levelInfo.level,
          levelName: levelInfo.levelName,
          levelIcon: levelInfo.levelIcon
        };
      }));
    } else {
      const allTimeStats = await db
        .select()
        .from(gamification)
        .orderBy(desc(gamification.points))
        .limit(20);
      
      leaderboard = await Promise.all(allTimeStats.map(async (entry, index) => {
        const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, entry.userId));
        const levelInfo = getLevelInfo(entry.points || 0);
        return {
          rank: index + 1,
          userId: entry.userId,
          name: user?.name || 'Usuario',
          points: entry.points || 0,
          level: levelInfo.level,
          levelName: levelInfo.levelName,
          levelIcon: levelInfo.levelIcon
        };
      }));
    }
    
    res.json({ leaderboard });
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
    
    const earnedBadges = (stats?.badges || []) as BadgeEntry[];
    const badgeMap = new Map(earnedBadges.map(b => [b.id, b.unlockedAt]));
    
    const badges = BADGES.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      unlocked: badgeMap.has(badge.id),
      unlockedAt: badgeMap.get(badge.id) || null
    }));
    
    res.json({ badges });
  } catch (error) {
    next(error);
  }
}

export async function checkAchievements(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    
    let [stats] = await db.select().from(gamification).where(eq(gamification.userId, userId));
    
    if (!stats) {
      [stats] = await db.insert(gamification).values({
        userId,
        points: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        badges: []
      }).returning();
    }
    
    const existingBadges = (stats.badges || []) as BadgeEntry[];
    const existingBadgeIds = new Set(existingBadges.map(b => b.id));
    const newBadges: typeof BADGES[number][] = [];
    const now = new Date().toISOString();
    
    if (!existingBadgeIds.has('consistent_30') && (stats.streak || 0) >= 30) {
      newBadges.push(BADGES.find(b => b.id === 'consistent_30')!);
    }
    
    if (!existingBadgeIds.has('master') && (stats.points || 0) >= 7000) {
      newBadges.push(BADGES.find(b => b.id === 'master')!);
    }
    
    if (newBadges.length > 0) {
      const newBadgeEntries: BadgeEntry[] = newBadges.map(b => ({ id: b.id, unlockedAt: now }));
      const updatedBadges = [...existingBadges, ...newBadgeEntries];
      await db.update(gamification)
        .set({ badges: updatedBadges })
        .where(eq(gamification.userId, userId));
    }
    
    const currentLevel = getLevelInfo(stats.points || 0);
    let newLevel = null;
    
    if (currentLevel.level > (stats.level || 1)) {
      await db.update(gamification)
        .set({ level: currentLevel.level })
        .where(eq(gamification.userId, userId));
      
      newLevel = {
        level: currentLevel.level,
        name: currentLevel.levelName,
        icon: currentLevel.levelIcon
      };
    }
    
    res.json({
      newBadges: newBadges.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon
      })),
      newLevel
    });
  } catch (error) {
    next(error);
  }
}
