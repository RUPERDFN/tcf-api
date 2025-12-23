import { Router } from 'express';
import { query } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM achievements ORDER BY points ASC');
    res.json({ achievements: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/user', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const earned = await query(
      `SELECT a.*, ua.earned_at
       FROM achievements a
       JOIN user_achievements ua ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.earned_at DESC`,
      [req.user!.userId]
    );
    
    const available = await query(
      `SELECT * FROM achievements
       WHERE id NOT IN (
         SELECT achievement_id FROM user_achievements WHERE user_id = $1
       )
       ORDER BY points ASC`,
      [req.user!.userId]
    );
    
    res.json({
      earned: earned.rows,
      available: available.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;
