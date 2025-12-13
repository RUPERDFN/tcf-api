import { Router } from 'express';
import { query } from '../config/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/status', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1',
      [req.user!.userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        status: 'free',
        features: {
          menus_per_week: 1,
          swaps_per_menu: 0,
          export_shopping: false
        }
      });
    }
    
    const sub = result.rows[0];
    const now = new Date();
    const trialActive = sub.trial_end && new Date(sub.trial_end) > now;
    const periodActive = sub.current_period_end && new Date(sub.current_period_end) > now;
    
    const isActive = sub.status === 'active' || trialActive;
    
    res.json({
      ...sub,
      is_active: isActive,
      features: isActive ? {
        menus_per_week: 'unlimited',
        swaps_per_menu: 'unlimited',
        export_shopping: true
      } : {
        menus_per_week: 1,
        swaps_per_menu: 0,
        export_shopping: false
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/trial/start', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);
    
    const result = await query(
      `INSERT INTO subscriptions (user_id, status, trial_start, trial_end)
       VALUES ($1, 'trial', NOW(), $2)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [req.user!.userId, trialEnd]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Trial ya iniciado previamente' });
    }
    
    res.json({ trial_end: trialEnd });
  } catch (error) {
    next(error);
  }
});

export default router;
