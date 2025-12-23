import { Router } from 'express';
import { query } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { profileSchema } from '../utils/validation.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM user_profile WHERE user_id = $1',
      [req.user!.userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ exists: false });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    
    const result = await query(
      `INSERT INTO user_profile (
        user_id, budget_eur_week, diners, meals_per_day, days,
        diet_type, allergies, favorite_foods, disliked_foods, pantry_items
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) DO UPDATE SET
        budget_eur_week = $2,
        diners = $3,
        meals_per_day = $4,
        days = $5,
        diet_type = $6,
        allergies = $7,
        favorite_foods = $8,
        disliked_foods = $9,
        pantry_items = $10,
        updated_at = NOW()
      RETURNING *`,
      [
        req.user!.userId,
        data.budget_eur_week,
        data.diners,
        data.meals_per_day,
        data.days,
        data.diet_type,
        JSON.stringify(data.allergies),
        JSON.stringify(data.favorite_foods),
        JSON.stringify(data.disliked_foods || []),
        data.pantry_items || ''
      ]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
