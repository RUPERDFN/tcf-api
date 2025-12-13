import { Router } from 'express';
import { query } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { event_name, event_data, session_id } = req.body;
    
    await query(
      `INSERT INTO events (user_id, event_name, event_data, session_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user?.userId || null,
        event_name,
        JSON.stringify(event_data || {}),
        session_id || null,
        req.ip,
        req.get('user-agent') || null
      ]
    );
    
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
