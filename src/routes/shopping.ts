import { Router } from 'express';
import { query } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { shoppingListSchema } from '../utils/validation.js';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = shoppingListSchema.parse(req.body);
    
    const result = await query(
      `INSERT INTO shopping_lists (user_id, menu_id, list_json, total_items, estimated_cost_eur)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [req.user!.userId, data.menu_id || null, JSON.stringify(data.list_json), data.total_items || null, data.estimated_cost_eur || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/latest', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM shopping_lists WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user!.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No hay lista de compra' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
