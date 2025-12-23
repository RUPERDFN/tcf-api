import { Router } from 'express';
import { query } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { menuSchema } from '../utils/validation.js';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = menuSchema.parse(req.body);
    
    await query(
      'UPDATE menus SET is_active = false WHERE user_id = $1',
      [req.user!.userId]
    );
    
    const result = await query(
      `INSERT INTO menus (user_id, days, menu_json, total_cost_eur, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, created_at`,
      [req.user!.userId, data.days, JSON.stringify(data.menu_json), data.total_cost_eur]
    );
    
    await query(
      'UPDATE user_stats SET total_menus_generated = total_menus_generated + 1, last_activity_at = NOW() WHERE user_id = $1',
      [req.user!.userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/latest', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM menus WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [req.user!.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No hay menú activo' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/history', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const result = await query(
      'SELECT id, days, total_cost_eur, version, created_at FROM menus WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user!.userId, limit, offset]
    );
    
    res.json({ menus: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
