import { Router } from 'express';
import { getStats, getPointsHistory, getLeaderboard, getBadges } from '../controllers/gamification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authMiddleware, getStats);
router.get('/history', authMiddleware, getPointsHistory);
router.get('/leaderboard', authMiddleware, getLeaderboard);
router.get('/badges', authMiddleware, getBadges);

export default router;
