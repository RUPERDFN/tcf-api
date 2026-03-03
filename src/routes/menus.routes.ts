import { Router } from 'express';
import { generate, getCurrent, getHistory, swap, completeMeal, getRecipeEndpoint, deleteMenu, getMenuMacros } from '../controllers/menus.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/generate', authMiddleware, generate);
router.get('/current', authMiddleware, getCurrent);
router.get('/history', authMiddleware, getHistory);
router.post('/:menuId/swap', authMiddleware, swap);
router.post('/:menuId/complete-meal', authMiddleware, completeMeal);
router.get('/:menuId/recipe/:dayIndex/:mealType', authMiddleware, getRecipeEndpoint);
router.get('/:menuId/macros', authMiddleware, getMenuMacros);
router.delete('/:menuId', authMiddleware, deleteMenu);

export default router;
