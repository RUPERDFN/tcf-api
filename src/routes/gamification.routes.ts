import { Router } from 'express';
import { getStats, getLeaderboard, getBadges, checkAchievements } from '../controllers/gamification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authMiddleware, getStats);
router.get('/leaderboard', authMiddleware, getLeaderboard);
router.get('/badges', authMiddleware, getBadges);
router.post('/check-achievements', authMiddleware, checkAchievements);

export default router;
