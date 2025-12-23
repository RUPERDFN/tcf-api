import { Router } from 'express';
import { query } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM user_stats WHERE user_id = $1',
      [req.user!.userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        total_points: 0,
        level: 1,
        total_menus_generated: 0
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
