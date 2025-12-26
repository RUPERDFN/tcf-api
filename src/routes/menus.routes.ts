import { Router } from 'express';
import { generate, getActive, getHistory, completeMeal } from '../controllers/menus.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/generate', authMiddleware, generate);
router.get('/active', authMiddleware, getActive);
router.get('/history', authMiddleware, getHistory);
router.post('/complete', authMiddleware, completeMeal);

export default router;
